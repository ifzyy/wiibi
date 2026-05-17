import chalk from "chalk";
import { format } from "sql-formatter";

export function sequelizeLogger(sql, timing) {
    console.log("CUSTOM LOGGER LOADED");
  try {
    // remove the "Executing (default):" part
    const cleanedSql = sql.replace(/^Executed \(.*?\): /, "");

    const formatted = format(cleanedSql, {
      language: "mysql",
      uppercase: true,
    });

    // detect query type
    const queryType = cleanedSql.split(" ")[0].toUpperCase();

    const typeColor =
      queryType === "SELECT"
        ? chalk.blue
        : queryType === "INSERT"
        ? chalk.green
        : queryType === "UPDATE"
        ? chalk.yellow
        : queryType === "DELETE"
        ? chalk.red
        : chalk.magenta;

    const header = typeColor(` ${queryType} QUERY `);

    console.log("");
    console.log(chalk.gray("┌──────────────────────────────────────────────"));
    console.log(chalk.gray("│"), header);
    console.log(chalk.gray("├──────────────────────────────────────────────"));

    formatted.split("\n").forEach((line) => {
      console.log(chalk.gray("│ ") + chalk.white(line));
    });

    console.log(chalk.gray("│"));

    if (timing !== undefined) {
      const timeColor = timing > 50 ? chalk.red : chalk.green;
      console.log(chalk.gray("│ ") + timeColor(`⏱ ${timing} ms`));

      if (timing > 100) {
        console.log(chalk.gray("│ ") + chalk.red("🐢 SLOW QUERY DETECTED"));
      }
    }

    console.log(chalk.gray("└──────────────────────────────────────────────"));
    console.log("");
  } catch (err) {
    console.log(sql);
  }
}