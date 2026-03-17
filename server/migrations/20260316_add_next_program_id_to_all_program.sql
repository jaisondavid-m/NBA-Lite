ALTER TABLE all_program
  ADD COLUMN next_program_id INT DEFAULT NULL;

ALTER TABLE all_program
  ADD CONSTRAINT fk_next_program
    FOREIGN KEY (next_program_id) REFERENCES all_program(id);

CREATE INDEX idx_all_program_next_program_id ON all_program(next_program_id);
