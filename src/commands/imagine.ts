import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, EmbedBuilder, InteractionContextType, Message } from 'discord.js';

import OpenAI, { APIError } from 'openai';

const ai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY'] // This is the default and can be omitted
});

@ApplyOptions<Command.Options>({
	description: 'Generates an image based on a prompt with the DALL-E 3 model'
})
export class UserCommand extends Command {
	public constructor(context: Command.Context) {
		super(context, {
			// This is where you define the command options
			// For example, the command name, description, etc.
			cooldownDelay: Time.Second * 30,
			cooldownFilteredUsers: ['519915800987959313'],
			typing: true
		});
	}

	// Message command
	public override async messageRun(message: Message, args: Args) {
		return this.imagine(message, args);
	}

	private async imagine(message: Message, args: Args) {
		const prompt = String(await args.rest('string'));
		const fileName = String(Math.floor(new Date().getTime()/1000)) + "-" + String(prompt).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/gi, "").toLowerCase().substring(0, 54) + ".png";
		const user = message.author.id;

		try {
			const replyMessage = await message.reply({ content: 'Okei, hmm...' });
			
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
				content: null,
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
				if (!message.channel.isSendable()) return;
				return message.reply({
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
