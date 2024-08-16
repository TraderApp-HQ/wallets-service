/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.json",
			},
		],
	},
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
	moduleFileExtensions: ["ts", "js"],
};