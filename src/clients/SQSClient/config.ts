export const ChannelTypes = {
	EMAIL: "EMAIL",
	SMS: "SMS",
	WHATSAPP: "WHATSAPP",
	IN_APP: "IN_APP",
	PUSH: "PUSH",
} as const;

export type ChannelType = keyof typeof ChannelTypes;

export const EventTemplates = {
	WELCOME: "WELCOME",
	LOGIN: "LOGIN",
	GENERAL: "GENERAL",
	RESET_PASSWORD: "RESET_PASSWORD",
	OTP: "OTP",
	CREATE_USER: "CREATE_USER",
	INVITE_USER: "INVITE_USER",
} as const;

export type EventTemplate = keyof typeof EventTemplates;

export function isEventTemplateKey(templateName: EventTemplate): templateName is EventTemplate {
	return Object.keys(EventTemplates).includes(templateName);
}
