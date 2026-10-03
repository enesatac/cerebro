-- Links kept in the order the user entered them (roles of an account, benefit types and related
-- applications of a demand, related applications of a contract), as the screens show them.
ALTER TABLE user_roles ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE demand_benefit_types ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE demand_applications ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contract_applications ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
