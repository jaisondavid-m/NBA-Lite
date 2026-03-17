const pool = require("../db");

const parseAcademicYear = (academicYear) => {
  const raw = String(academicYear || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const startYear = Number.parseInt(match[1], 10);
  const endYearShort = Number.parseInt(match[2], 10);
  if ((startYear + 1) % 100 !== endYearShort) return null;

  return { label: raw, startYear };
};

const formatAcademicYear = (startYear) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const buildAcademicWindow = (startYear) => ({
  label: formatAcademicYear(startYear),
  windowStart: `${startYear}-08-31`,
  windowEnd: `${startYear + 1}-04-25`,
});

const getAcademicYearCandidates = (startYear) => [formatAcademicYear(startYear), String(startYear)];

const buildInClause = (values) => values.map(() => "?").join(",");

const toDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isProfessorDesignation = (designation) => {
  const text = String(designation || "").toLowerCase();
  return text.includes("professor") && !text.includes("associate") && !text.includes("assistant");
};

const isAssociateDesignation = (designation) => {
  const text = String(designation || "").toLowerCase();
  return text.includes("associate") && text.includes("professor");
};

const isAssistantDesignation = (designation) => {
  const text = String(designation || "").toLowerCase();
  return text.includes("assistant") && text.includes("professor");
};

const resolveDesignationBucket = (designation) => {
  if (isProfessorDesignation(designation)) return "Professor";
  if (isAssociateDesignation(designation)) return "Associate Professor";
  if (isAssistantDesignation(designation)) return "Assistant Professor";
  return null;
};

const resolveDesignationForWindow = (facultyRow, windowStartDate) => {
  const presentBucket = resolveDesignationBucket(facultyRow.present_designation);
  if (presentBucket !== "Professor") {
    return presentBucket;
  }

  const promotedAsProf = toDateOrNull(facultyRow.date_designated_as_prof);
  if (promotedAsProf && promotedAsProf > windowStartDate) {
    return resolveDesignationBucket(facultyRow.designation_at_joining);
  }

  return "Professor";
};

const countFacultyForWindow = (rows, windowStartDate, windowEndDate) =>
  rows.reduce((count, row) => {
    const joiningDate = toDateOrNull(row.date_of_joining);
    if (!joiningDate || joiningDate > windowStartDate) {
      return count;
    }

    const leavingDate = toDateOrNull(row.date_of_leaving);
    if (leavingDate && leavingDate <= windowEndDate) {
      return count;
    }

    const designationBucket = resolveDesignationForWindow(row, windowStartDate);
    if (!designationBucket) {
      return count;
    }

    return count + 1;
  }, 0);

const getProgramChainIds = async (connection, startProgramId) => {
  const chain = [];
  const visited = new Set();
  let currentId = Number(startProgramId);
  const MAX_DEPTH = 100;

  while (currentId && chain.length < MAX_DEPTH) {
    if (visited.has(currentId)) {
      throw new Error("Cycle detected in all_program.next_program_id chain");
    }
    visited.add(currentId);

    const [rows] = await connection.execute(
      "SELECT id, next_program_id FROM all_program WHERE id = ? LIMIT 1",
      [currentId],
    );

    if (rows.length === 0) {
      throw new Error(`Program id ${currentId} not found in all_program`);
    }

    const row = rows[0];
    chain.push(Number(row.id));
    currentId = row.next_program_id ? Number(row.next_program_id) : null;
  }

  if (chain.length >= MAX_DEPTH) {
    throw new Error("Program chain exceeds maximum traversal depth");
  }

  return chain;
};

const resolveSelectedBaseProgramIds = async (connection, selectedProgramId) => {
  const normalizedId = Number(selectedProgramId);

  // Top filter usually sends program_name.id, while some callers may send all_program.id.
  const [byProgramName] = await connection.execute(
    `SELECT id
     FROM all_program
     WHERE programname = ?
     ORDER BY id ASC`,
    [normalizedId],
  );

  if (byProgramName.length > 0) {
    return byProgramName.map((row) => Number(row.id));
  }

  const [byAllProgramId] = await connection.execute(
    `SELECT id
     FROM all_program
     WHERE id = ?
     LIMIT 1`,
    [normalizedId],
  );

  if (byAllProgramId.length > 0) {
    return [Number(byAllProgramId[0].id)];
  }

  return [];
};

const getExpandedProgramIds = async (connection, baseProgramIds) => {
  const expanded = new Set();

  for (const programId of baseProgramIds) {
    const chain = await getProgramChainIds(connection, programId);
    chain.forEach((id) => expanded.add(id));
  }

  return Array.from(expanded);
};

const getProgramNameIdsForAllProgramIds = async (connection, allProgramIds) => {
  if (!allProgramIds.length) return [];

  const [rows] = await connection.execute(
    `SELECT DISTINCT programname
     FROM all_program
     WHERE id IN (${buildInClause(allProgramIds)})
       AND programname IS NOT NULL`,
    allProgramIds,
  );

  return rows
    .map((row) => Number(row.programname))
    .filter((value) => Number.isFinite(value));
};

const getAlliedBaseProgramIds = async (connection, selectedProgramIds, academicYearLabel) => {
  if (!selectedProgramIds.length) return [];

  const [rows] = await connection.execute(
    `SELECT acm.group_id, acm.program_id
     FROM allied_course_group acg
     INNER JOIN allied_course_mapping acm ON acm.group_id = acg.id
     WHERE acg.academic_year = ?`,
    [academicYearLabel],
  );

  const groupToProgramIds = new Map();
  rows.forEach((row) => {
    const groupId = Number(row.group_id);
    const programId = Number(row.program_id);
    if (!groupToProgramIds.has(groupId)) {
      groupToProgramIds.set(groupId, []);
    }
    groupToProgramIds.get(groupId).push(programId);
  });

  const selectedSet = new Set(selectedProgramIds.map((id) => Number(id)));
  const alliedBaseSet = new Set();

  groupToProgramIds.forEach((programIds) => {
    const touchesSelected = programIds.some((id) => selectedSet.has(id));
    if (!touchesSelected) return;

    programIds.forEach((id) => {
      if (!selectedSet.has(id)) {
        alliedBaseSet.add(id);
      }
    });
  });

  return Array.from(alliedBaseSet);
};

const getStudentTotalForProgramsAndYear = async (connection, programIds, yearLabel) => {
  if (!programIds.length) return 0;

  const parsedYear = parseAcademicYear(yearLabel);
  if (!parsedYear) return 0;

  const intakeYearCandidates = getAcademicYearCandidates(parsedYear.startYear);
  const cayYearCandidates = getAcademicYearCandidates(parsedYear.startYear);

  const [intakeRows] = await connection.execute(
    `SELECT SUM(COALESCE(current_intake, 0)) AS total
     FROM intake_details
     WHERE program_id IN (${buildInClause(programIds)})
       AND academic_year IN (${buildInClause(intakeYearCandidates)})`,
    [...programIds, ...intakeYearCandidates],
  );

  const [entryRows] = await connection.execute(
    `SELECT SUM(COALESCE(actual_lateral_admitted, 0)) AS total
     FROM student_by_department
     WHERE program_id IN (${buildInClause(programIds)})
       AND cay_academic_year IN (${buildInClause(cayYearCandidates)})`,
    [...programIds, ...cayYearCandidates],
  );

  const intakeTotal = Number(intakeRows[0]?.total || 0);
  const lateralTotal = Number(entryRows[0]?.total || 0);

  return intakeTotal + lateralTotal;
};

const getFacultyCountByYear = async (connection, programNameIds, windows) => {
  const totals = Object.fromEntries(windows.map((window) => [window.label, 0]));
  if (!programNameIds.length) return totals;

  for (const window of windows) {
    const [rows] = await connection.execute(
      `SELECT f.present_designation, f.designation_at_joining, f.date_designated_as_prof, f.date_of_joining, f.date_of_leaving
       FROM faculty_details f
       INNER JOIN programname_level_discipline pld ON pld.id = f.program_id
       WHERE pld.name IN (${buildInClause(programNameIds)})
         AND f.date_of_joining IS NOT NULL
         AND f.date_of_joining <= ?
         AND (f.date_of_leaving IS NULL OR f.date_of_leaving > ?)`,
      [...programNameIds, window.windowStart, window.windowEnd],
    );

    totals[window.label] = countFacultyForWindow(
      rows,
      new Date(`${window.windowStart}T00:00:00`),
      new Date(`${window.windowEnd}T00:00:00`),
    );
  }

  return totals;
};

const toWindowData = (totalsByLabel, labels) => ({
  CAY: Number(totalsByLabel[labels.CAY] || 0),
  CAYm1: Number(totalsByLabel[labels.CAYm1] || 0),
  CAYm2: Number(totalsByLabel[labels.CAYm2] || 0),
});

const getRatioByDepartment = async (req, res) => {
  const { program_id, academicYear } = req.query;

  if (!program_id) {
    return res.status(400).json({ success: false, error: "program_id is required" });
  }

  const parsedAcademicYear = parseAcademicYear(academicYear);
  if (!parsedAcademicYear) {
    return res.status(400).json({ success: false, error: "academicYear must be in YYYY-YY format" });
  }

  const selectedProgramId = Number.parseInt(program_id, 10);
  if (!Number.isFinite(selectedProgramId)) {
    return res.status(400).json({ success: false, error: "program_id must be a number" });
  }

  const connection = await pool.getConnection();

  try {
    const windows = [
      { key: "CAY", ...buildAcademicWindow(parsedAcademicYear.startYear) },
      { key: "CAYm1", ...buildAcademicWindow(parsedAcademicYear.startYear - 1) },
      { key: "CAYm2", ...buildAcademicWindow(parsedAcademicYear.startYear - 2) },
    ];

    const labels = {
      CAY: windows[0].label,
      CAYm1: windows[1].label,
      CAYm2: windows[2].label,
    };

    const selectedBaseProgramIds = await resolveSelectedBaseProgramIds(connection, selectedProgramId);
    if (!selectedBaseProgramIds.length) {
      return res.status(400).json({ success: false, error: "Selected program was not found in all_program" });
    }

    const selectedChainProgramIds = await getExpandedProgramIds(connection, selectedBaseProgramIds);

    const alliedBaseProgramIds = await getAlliedBaseProgramIds(
      connection,
      selectedChainProgramIds,
      labels.CAY,
    );

    const alliedExpandedProgramIds = await getExpandedProgramIds(connection, alliedBaseProgramIds);

    const selectedSet = new Set(selectedChainProgramIds.map((id) => Number(id)));
    const alliedProgramIds = alliedExpandedProgramIds.filter((id) => !selectedSet.has(Number(id)));

    const [departmentStudentTotalsByYear, alliedStudentTotalsByYear] = await Promise.all([
      Promise.all(
        windows.map(async (window) => [
          window.label,
          await getStudentTotalForProgramsAndYear(connection, selectedChainProgramIds, window.label),
        ]),
      ).then((pairs) => Object.fromEntries(pairs)),
      Promise.all(
        windows.map(async (window) => [
          window.label,
          await getStudentTotalForProgramsAndYear(connection, alliedProgramIds, window.label),
        ]),
      ).then((pairs) => Object.fromEntries(pairs)),
    ]);

    const [departmentProgramNameIds, alliedProgramNameIds] = await Promise.all([
      getProgramNameIdsForAllProgramIds(connection, selectedChainProgramIds),
      getProgramNameIdsForAllProgramIds(connection, alliedProgramIds),
    ]);

    const [departmentFacultyTotalsByYear, alliedFacultyTotalsByYear] = await Promise.all([
      getFacultyCountByYear(connection, departmentProgramNameIds, windows),
      getFacultyCountByYear(connection, alliedProgramNameIds, windows),
    ]);

    const DS = toWindowData(departmentStudentTotalsByYear, labels);
    const AS = toWindowData(alliedStudentTotalsByYear, labels);
    const DF = toWindowData(departmentFacultyTotalsByYear, labels);
    const AF = toWindowData(alliedFacultyTotalsByYear, labels);

    const S = {
      CAY: DS.CAY + AS.CAY,
      CAYm1: DS.CAYm1 + AS.CAYm1,
      CAYm2: DS.CAYm2 + AS.CAYm2,
    };

    const F = {
      CAY: DF.CAY + AF.CAY,
      CAYm1: DF.CAYm1 + AF.CAYm1,
      CAYm2: DF.CAYm2 + AF.CAYm2,
    };

    return res.json({
      success: true,
      data: {
        labels,
        DS,
        AS,
        S,
        DF,
        AF,
        F,
      },
    });
  } catch (error) {
    console.error("Error building ratio by department:", error);
    if (error.message && (
      error.message.includes("not found") ||
      error.message.includes("Cycle detected") ||
      error.message.includes("maximum traversal depth")
    )) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(500).json({ success: false, error: "Failed to build ratio data" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getRatioByDepartment,
};
