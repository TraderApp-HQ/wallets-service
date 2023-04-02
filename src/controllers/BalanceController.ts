import { Request, Response, NextFunction } from "express";

// A function to check balance, deduct order amount and fees
export async function processOrder(req: Request, res: Response, next: NextFunction) {
	try {
		res.status(200).json("Process order controller working");
	} catch (error: any) {
		next(error);
	}
}
