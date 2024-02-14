import { SlashCommandBuilder } from 'discord.js';

const sourceCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Get the ping of Currency Bot!')

export default sourceCommand.toJSON()
