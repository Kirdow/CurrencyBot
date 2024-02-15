import { SlashCommandBuilder } from 'discord.js';

const convertCommand = new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert currencies')
    .addNumberOption((option) =>
        option
            .setName('value')
            .setDescription('The value of currency which to convert')
            .setMinValue(0.0)
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('from')
            .setDescription('The origin currency to convert from')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('to')
            .setDescription('The destination currency to convert to')
    )

export default convertCommand.toJSON()
