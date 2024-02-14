import { SlashCommandBuilder } from 'discord.js';

const currencyCommand = new SlashCommandBuilder()
    .setName('currency')
    .setDescription('Create a currency prompt!')
    .addStringOption((option) =>
        option.setName('prompt').setDescription('Currency prompt!')
    )

export default currencyCommand.toJSON()
