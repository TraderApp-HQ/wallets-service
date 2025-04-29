import { Message } from "@aws-sdk/client-sqs";
import { SQSRecord } from "aws-lambda";
import { ChannelType, EventTemplate } from "./config";

export interface IMessageObject {
	recipientName: string;
	lastName?: string;
	phoneNumber?: string;
	emailAddress?: string;
	countryPhoneCode?: string;
	messageBody: string;
	messageHeader?: string;
}

export interface IQueueMessage {
	channel: ChannelType[];
	messageObject: IMessageObject;
	event: EventTemplate;
	client?: string;
}
export interface QueueMessage extends Omit<Message, "Body"> {
	Body: IQueueMessage;
}

export interface IMessageRecipient {
	firstName: string;
	lastName?: string;
	phoneNumber?: string;
	emailAddress?: string;
	countryPhoneCode?: string;
}

export interface IQueueMessageBodyObject {
	recipients: IMessageRecipient[];
	subject?: string;
	message: string;
	event: EventTemplate;
	sender?: IMessageRecipient;
}

export interface IQueueMessageBody extends Omit<SQSRecord, "body"> {
	body: IQueueMessageBodyObject;
}
