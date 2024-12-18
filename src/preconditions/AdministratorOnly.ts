import { Precondition } from '@sapphire/framework';
import { PermissionFlagsBits, type CommandInteraction, type ContextMenuCommandInteraction, type GuildMember, type Message } from 'discord.js';

export class AdministratorOnlyPrecondition extends Precondition {
  public override async messageRun(message: Message) {
    // for Message Commands
    return this.checkAdministrator(message.member as GuildMember);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    // for Slash Commands
    return this.checkAdministrator(interaction.member as GuildMember);
  }

  public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
    // for Context Menu Command
    return this.checkAdministrator(interaction.member as GuildMember);
  }

  private async checkAdministrator(member: GuildMember | null) {
    return member?.permissions.has(PermissionFlagsBits.Administrator)
      ? this.ok()
      : this.error({ message: 'Only the bot owner can use this command!' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    AdministratorOnly: never;
  }
}

export default undefined;