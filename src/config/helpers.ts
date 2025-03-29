import { ErrorName } from "./enums";

export const throwApplicationError = ({ name, message }: { name: ErrorName; message: string }) => {
	const error = new Error(message);
	error.name = name;
	throw error;
};
