export const ChannelTypes = {
	PUSH: "PUSH",
} as const;

export type ChannelType = keyof typeof ChannelTypes;

export const EventTemplates = {
	CREATE_USER_WALLET: "CREATE_USER_WALLET",
} as const;

export type EventTemplate = keyof typeof EventTemplates;

export function isEventTemplateKey(templateName: EventTemplate): templateName is EventTemplate {
	return Object.keys(EventTemplates).includes(templateName);
}
