import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { ApplicationCommandOptionType, ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, EmbedBuilder, InteractionContextType, Message } from 'discord.js';

import OpenAI, { APIError } from 'openai';

const ai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY'] // This is the default and can be omitted
});

@ApplyOptions<Command.Options>({
	description: 'Generates an image based on a prompt with the DALL-E 3 model',
	cooldownDelay: Time.Second * 30,
	cooldownFilteredUsers: ['519915800987959313'],
	typing: true
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [
			ApplicationIntegrationType.GuildInstall,
			// ApplicationIntegrationType.UserInstall

		];
		const contexts: InteractionContextType[] = [
			// InteractionContextType.BotDM,
			InteractionContextType.Guild,
			// InteractionContextType.PrivateChannel
		];

		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			integrationTypes,
			contexts,
			options: [
				{
					name: 'prompt',
					description: 'The prompt to generate an image from',
					required: true,
					type: ApplicationCommandOptionType.String
				}
			]
		});

		// Register Context Menu command available from any message
		// registry.registerContextMenuCommand({
		// 	name: this.name,
		// 	type: ApplicationCommandType.Message,
		// 	integrationTypes,
		// 	contexts
		// });

		// Register Context Menu command available from any user
		// registry.registerContextMenuCommand({
		// 	name: this.name,
		// 	type: ApplicationCommandType.User,
		// 	integrationTypes,
		// 	contexts
		// });
	}

	// Message command
	public override async messageRun(message: Message, args: Args) {
		const prompt = String(await args.rest('string'));
		return this.imagine(message, prompt);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const prompt = interaction.options.getString('prompt', true);
		return this.imagine(interaction, prompt);
	}

	private async imagine(interactionOrMessage: Message | Command.ChatInputCommandInteraction, prompt: string) {
		const fileName = String(Math.floor(new Date().getTime() / 1000)) + "-" + String(prompt).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/gi, "").toLowerCase().substring(0, 54) + ".png";
		const user = interactionOrMessage instanceof Message ? interactionOrMessage.author.id : interactionOrMessage.user.id;

		try {
			const replyMessage = interactionOrMessage instanceof Message
				? await interactionOrMessage.reply({ content: `<@${user}> Okei, hmm...` })
				: interactionOrMessage.channel?.isSendable() ? await interactionOrMessage.reply({ content: `Okei, hmmm...` }) : null

			if (!replyMessage) return;

			const response = await ai.images.generate({
				model: 'dall-e-3',
				prompt,
				n: 1,
				size: '1024x1024',
				response_format: 'b64_json',
				user,
			});

			if (!response.data[0].b64_json) {
				const errorMessage = (response as any).data[0].error.message;
				return replyMessage.edit({
					content: "I'm sorry, I couldn't imagine anything for that prompt.",
					embeds: [
						{
							title: 'Error',
							description: errorMessage,
							color: 15548997
						}
					]
				});
			}

			const imageBuffer = Buffer.from(response.data[0].b64_json || '', 'base64');
			const embedFile = new AttachmentBuilder(imageBuffer, { name: fileName });
			const revisedPrompt = String(response.data[0].revised_prompt);

			return replyMessage.edit({
				content: ``,
				embeds: [
					{
						title: '',
						image: { url: `attachment://${embedFile.name}` },
						footer: {
							text: revisedPrompt
						}
					}
				],
				files: [embedFile]
			});
		} catch (error) {
			if (error instanceof APIError) {
				const errorMessage = interactionOrMessage instanceof Message
					? interactionOrMessage.reply({
						content: "I'm sorry, I couldn't imagine anything for that prompt.",
						embeds: [
							{
								description: error.message,
								color: 15548997
							}
						]
					})
					: interactionOrMessage.channel?.isSendable() && interactionOrMessage.channel.send({
					content: "I'm sorry, I couldn't imagine anything for that prompt.",
					embeds: [
						{
							description: error.message,
							color: 15548997
						}
					]
				});
			}

			throw error;
		}
	}
}
