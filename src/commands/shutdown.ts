import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Shuts down the bot'
})
export class UserCommand extends Command {
	// public constructor(context: Command.LoaderContext) {
	// 	super(context, {
	// 		preconditions: ['AdministratorOnly']
	// 	});
	// }

	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [
			InteractionContextType.Guild,
		];

		registry.registerChatInputCommand({
			name: this.name,
			description: this.description,
			integrationTypes,
			contexts
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.reply({ content: 'Sammutaan... 🥴💤' });
		process.exit(0);
	}
}
