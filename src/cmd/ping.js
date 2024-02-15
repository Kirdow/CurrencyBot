import { SlashCommandBuilder } from 'discord.js';

const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Get the ping of Currency Bot!')
    .addNumberOption((option) =>
        option
            .setName('samples')
            .setDescription('Number of samples')
            .addChoices(
                { name: '5 Samples', value: 5 },
                { name: '7 Samples', value: 7 }
            )
            .setRequired(true)
    )

export default pingCommand.toJSON()
