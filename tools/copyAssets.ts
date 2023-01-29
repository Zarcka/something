import * as shell from "shelljs";

shell.cp( "-R", "./views", "dist/" );
shell.cp( "-R", "./public", "dist/" );