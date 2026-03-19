import path from "path";
import { SequelizeStorage, Umzug } from "umzug";
import { buildSequelize, sequelize } from "./index";

export async function getMigrationRunner() {
  const seq = sequelize || buildSequelize();

  return new Umzug({
    migrations: {
      glob: path.join(__dirname, "migrations/*.ts"),
      resolve: ({ name, path: filePath, context }) => {
        const migration = require(filePath!);
        const { DataTypes } = require("sequelize");
        return {
          name,
          up: async () => migration.default.up(context, DataTypes),
          down: async () => migration.default.down(context, DataTypes),
        };
      },
    },
    context: seq.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize: seq }),
    logger: console,
  });
}
