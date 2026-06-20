ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    // Helper function for time formatting (ticks -> d h m)
    const formatTime = (ticks) => {
        let totalSeconds = Math.floor(ticks / 20);
        let days = Math.floor(totalSeconds / 86400);
        let hours = Math.floor((totalSeconds % 86400) / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    // --- /PLAYTIME COMMAND ---
    event.register(
        Commands.literal('playtime')
            .executes(ctx => {
                if (!ctx.source.player) return 0;
                return showPlayerPlaytime(ctx, ctx.source.player.name.string);
            })
            .then(
                Commands.argument('target', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        try {
                            const target = Arguments.PLAYER.getResult(ctx, 'target');
                            return showPlayerPlaytime(ctx, target.name.string);
                        } catch (e) {
                            ctx.source.sendFailure(Text.red("Player not found or invalid name."));
                            return 0;
                        }
                    })
            )
    );

    function showPlayerPlaytime(ctx, targetName) {
        let server = ctx.source.server;
        let allProfiles = server.profileCache.load();
        
        let profileEntry = allProfiles.find(p => p.profile.name.toLowerCase() === targetName.toLowerCase());

        if (!profileEntry) {
            ctx.source.sendFailure(Text.red(`Error: Player '${targetName}' has never joined this server.`));
            return 0;
        }

        let uuid = profileEntry.profile.id;
        let actualName = profileEntry.profile.name;
        let playerData = server.getPlayer(uuid);
        let stats = playerData ? playerData.stats : server.getOfflinePlayer(uuid).stats;

        if (!stats) {
            ctx.source.sendFailure(Text.red(`Could not retrieve playtime for ${actualName}.`));
            return 0;
        }

        let myTicks = stats.playTime || 0;
        
        // Calculate rank
        let allTimes = [];
        allProfiles.forEach(profile => {
            let pData = server.getPlayer(profile.profile.id);
            if(pData && pData.stats.playTime > 0){
                allTimes.push(pData.stats.playTime);
            }
        });
        
        allTimes.sort((a, b) => b - a);
        let rank = allTimes.indexOf(myTicks) + 1;

        ctx.source.sendSuccess(Text.gold(`--- [ Playtime: ${actualName} ] ---`).bold(), false);
        ctx.source.sendSuccess(Text.white(`🕒 Time played: `).append(Text.green(formatTime(myTicks))), false);
        ctx.source.sendSuccess(Text.white(`🏆 Server rank: `).append(Text.aqua(`#${rank} / ${allTimes.length}`)), false);
        ctx.source.sendSuccess(Text.gold('---------------------------').bold(), false);

        return 1;
    }

    // --- /TOPTIME COMMAND ---
    event.register(
        Commands.literal('toptime')
            .executes(ctx => showTopTime(ctx, 1))
            .then(Commands.argument('page', Arguments.INTEGER.create(event))
                .executes(ctx => showTopTime(ctx, Arguments.INTEGER.getResult(ctx, 'page')))
            )
    );

    function showTopTime(ctx, page) {
        let server = ctx.source.server;
        let data = [];
        let pageSize = 10;

        if (page < 1) page = 1;

        let allProfiles = server.profileCache.load();
        if (!allProfiles || allProfiles.length === 0) {
            ctx.source.sendFailure(Text.red("No player data found."));
            return 0;
        }

        allProfiles.forEach(profile => {
            let playerData = server.getPlayer(profile.profile.id);
            if (playerData) {
                let t = playerData.stats.playTime;
                if (t > 0) data.push({ name: profile.profile.name, ticks: t });
            }
        });

        data.sort((a, b) => b.ticks - a.ticks);
        let maxPages = Math.ceil(data.length / pageSize) || 1;
        if (page > maxPages) page = maxPages;

        let start = (page - 1) * pageSize;
        let pageData = data.slice(start, start + pageSize);

        ctx.source.sendSuccess(Text.gold(`--- [ Top Playtime: Page ${page}/${maxPages} ] ---`).bold(), false);
        pageData.forEach((entry, index) => {
            let rank = start + index + 1;
            ctx.source.sendSuccess(Text.yellow(`${rank}. ${entry.name}: `).append(Text.white(formatTime(entry.ticks))), false);
        });
        ctx.source.sendSuccess(Text.gold('---------------------------').bold(), false);

        return 1;
    }

    // --- /STATS COMMAND ---
    event.register(
        Commands.literal('stats')
            .executes(ctx => {
                if (!ctx.source.player) return 0;
                return showPlayerStats(ctx, ctx.source.player.name.string);
            })
            .then(
                Commands.argument('target', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        try {
                            const target = Arguments.PLAYER.getResult(ctx, 'target');
                            return showPlayerStats(ctx, target.name.string);
                        } catch (e) {
                            ctx.source.sendFailure(Text.red("Player not found or invalid name."));
                            return 0;
                        }
                    })
            )
    );

    function showPlayerStats(ctx, targetName) {
        let server = ctx.source.server;
        let allProfiles = server.profileCache.load();
        
        let profileEntry = allProfiles.find(p => p.profile.name.toLowerCase() === targetName.toLowerCase());

        if (!profileEntry) {
            ctx.source.sendFailure(Text.red(`Error: Player '${targetName}' not found in server database.`));
            return 0;
        }

        let uuid = profileEntry.profile.id;
        let actualName = profileEntry.profile.name;
        let playerData = server.getPlayer(uuid);
        let stats = playerData ? playerData.stats : server.getOfflinePlayer(uuid).stats;

        if (!stats) {
            ctx.source.sendFailure(Text.red(`Could not load stats for ${actualName}.`));
            return 0;
        }

        let playTimeTicks = stats.playTime || 0;
        let deaths = stats.deaths || 0;
        let mobKills = stats.mobKills || 0;
        let playerKills = stats.playerKills || 0;
        let jumps = stats.jumps || 0;
        let damageDealt = Math.floor((stats.damageDealt || 0) / 10);
        let dist = (stats.walkDistance || 0) + (stats.sprintDistance || 0);
        let kmTraveled = (dist / 100000).toFixed(2);

        let totalSeconds = playTimeTicks / 20;
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);

        ctx.source.sendSuccess(Text.gold(`--- [ Stats: ${actualName} ] ---`).bold(), false);
        ctx.source.sendSuccess(Text.white('🕒 Playtime: ').append(Text.green(`${hours}h ${minutes}m`)), false);
        ctx.source.sendSuccess(Text.white('⚔ Mob Kills: ').append(Text.red(mobKills)), false);
        ctx.source.sendSuccess(Text.white('⚔ Player Kills: ').append(Text.red(playerKills)), false);
        ctx.source.sendSuccess(Text.white('💀 Deaths: ').append(Text.darkRed(deaths)), false);
        ctx.source.sendSuccess(Text.white('💪 Damage Dealt: ').append(Text.yellow(`${damageDealt} HP`)), false);
        ctx.source.sendSuccess(Text.white('🦘 Jumps: ').append(Text.aqua(jumps)), false);
        ctx.source.sendSuccess(Text.white('🏃 Distance (on foot): ').append(Text.lightPurple(`${kmTraveled} km`)), false);
        ctx.source.sendSuccess(Text.gold('---------------------------').bold(), false);

        return 1;
    }
});