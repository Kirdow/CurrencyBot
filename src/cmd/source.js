import { SlashCommandBuilder } from 'discord.js';

const sourceCommand = new SlashCommandBuilder()
    .setName('source')
    .setDescription('Get the source code of Currency Bot!')

export default sourceCommand.toJSON()
