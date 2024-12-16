import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType, Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Hello world!'
})
export class UserCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Create shared integration types and contexts
		// These allow the command to be used in guilds and DMs
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		];

		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			integrationTypes,
			contexts
		});

		// Register Context Menu command available from any message
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.Message,
			integrationTypes,
			contexts
		});

		// Register Context Menu command available from any user
		registry.registerContextMenuCommand({
			name: this.name,
			type: ApplicationCommandType.User,
			integrationTypes,
			contexts
		});
	}

	// Message command
	public override async messageRun(message: Message) {
		return this.sendHelloWorld(message);
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendHelloWorld(interaction);
	}

	// Context Menu command
	public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
		return this.sendHelloWorld(interaction);
	}

	private async sendHelloWorld(interactionOrMessage: Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
		interactionOrMessage instanceof Message
			? interactionOrMessage.channel?.isSendable() && (await interactionOrMessage.channel.send({ content: 'Hello world!' }))
			: await interactionOrMessage.reply({ content: 'Hello world!', fetchReply: true });
	}
}
