import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import type { Message } from 'discord.js';

import OpenAI from 'openai';

const ai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

@ApplyOptions<Command.Options>({
	description: 'A basic command'
})
export class UserCommand extends Command {
	public constructor(context: Command.Context) {
		super(context, {
			// This is where you define the command options
			// For example, the command name, description, etc.
			cooldownDelay: Time.Second * 15,
			cooldownFilteredUsers: ['519915800987959313'],
			typing: true,
		});
	}

	public override async messageRun(message: Message, args: Args) {
		const prompt = String(await args.rest("string"));
		
		this.container.logger.info("Imagine", prompt);
		
		const response = await ai.images.generate({
			model: 'dall-e-3',
			prompt,
			n: 1,
			size: '1024x1024'
		});

		const revisedPrompt = String(response.data[0].revised_prompt);
		const imageUrl = response.data[0].url;

		this.container.logger.info(imageUrl, response);

		if (!imageUrl || !message.channel.isSendable()) return;

		return message.channel.send({
			embeds: [{
				image: {
					url: imageUrl
				},
				footer: {
					text: revisedPrompt
				}
			}]
		});
	}
}
