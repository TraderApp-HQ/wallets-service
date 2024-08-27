import { Message } from "@aws-sdk/client-sqs";
import { ChannelType, EventTemplate } from "./constants";

export interface IMessageObject {
	recipientName: string;
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
