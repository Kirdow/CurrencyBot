import { SlashCommandBuilder } from "discord.js";

const schemeCommand = new SlashCommandBuilder()
    .setName('scheme')
    .setDescription('Get current status of a currency on the market')
    .addStringOption((option) =>
        option
            .setName('currency')
            .setDescription('The currency to compare')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('reference')
            .setDescription('The currency to compare to')
    )

export default schemeCommand.toJSON()
