ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    // Stylish Prefix: [Admin] 
    const prefix = Text.darkGray("[").append(Text.gold("Admin")).append(Text.darkGray("] "));

    // --- ADMIN DASHBOARD ---
    event.register(Commands.literal('admin').requires(s => s.hasPermission(2)).executes(ctx => {
        let p = ctx.source.player;
        
        // Statystyki
        let flyStatus = p.abilities.mayfly ? Text.green("ON") : Text.red("OFF");
        let godStatus = p.abilities.invulnerable ? Text.green("ON") : Text.red("OFF");
        let speedVal = p.abilities.flying ? p.abilities.flyingSpeed * 10 : p.abilities.walkingSpeed * 10;
        let isVanish = p.potionEffects.isActive("minecraft:invisibility") ? Text.green("YES") : Text.red("NO");

        p.tell(Text.darkGray("---------------------------------"));
        p.tell(prefix.copy().append(Text.yellow("Current Player Status:")));
        p.tell(Text.gray(" » Fly: ").append(flyStatus).append(Text.gray(" | God: ")).append(godStatus));
        p.tell(Text.gray(" » Vanished: ").append(isVanish));
        p.tell(Text.gray(" » Current Speed: ").append(Text.aqua(speedVal.toFixed(1))));
        p.tell(Text.darkGray("---------------------------------"));
        p.tell(Text.gold("Available Commands:"));
        p.tell(Text.yellow("/fly").append(Text.white(" - Toggle flight mode")));
        p.tell(Text.yellow("/heal").append(Text.white(" - Restore health to max")));
        p.tell(Text.yellow("/feed").append(Text.white(" - Satiate hunger")));
        p.tell(Text.yellow("/god").append(Text.white(" - Toggle invulnerability")));
        p.tell(Text.yellow("/speed <val>").append(Text.white(" - Set fly/walk speed (1-10)")));
        p.tell(Text.yellow("/vanish").append(Text.white(" - Become invisible")));
        p.tell(Text.yellow("/invsee <player>").append(Text.white(" - Inspect inventory")));
        p.tell(Text.darkGray("---------------------------------"));
        
        return 1;
    }));

    // --- EXISTING COMMANDS (with updated styling) ---

    // FLY
    event.register(Commands.literal('fly').requires(s => s.hasPermission(2)).executes(ctx => {
        let p = ctx.source.player;
        let canFly = !p.abilities.mayfly;
        p.abilities.mayfly = canFly;
        p.abilities.flying = canFly;
        p.onUpdateAbilities();
        p.tell(prefix.copy().append(Text.gray("Flight mode: ")).append(canFly ? Text.green("ENABLED") : Text.red("DISABLED")));
        return 1;
    }));

    // HEAL
    event.register(Commands.literal('heal').requires(s => s.hasPermission(2)).executes(ctx => {
        ctx.source.player.health = ctx.source.player.maxHealth;
        ctx.source.player.tell(prefix.copy().append(Text.green("❤ Your health has been restored!")));
        return 1;
    }));

    // FEED
    event.register(Commands.literal('feed').requires(s => s.hasPermission(2)).executes(ctx => {
        ctx.source.player.foodLevel = 20;
        ctx.source.player.tell(prefix.copy().append(Text.yellow("🍎 Your hunger has been satisfied!")));
        return 1;
    }));

    // GOD MODE
    event.register(Commands.literal('god').requires(s => s.hasPermission(2)).executes(ctx => {
        let p = ctx.source.player;
        let isGod = !p.abilities.invulnerable;
        p.abilities.invulnerable = isGod;
        p.onUpdateAbilities();
        p.tell(prefix.copy().append(Text.gold("God mode: ")).append(isGod ? Text.green("ENABLED") : Text.red("DISABLED")));
        return 1;
    }));

    // SPEED
    event.register(Commands.literal('speed').requires(s => s.hasPermission(2))
        .then(Commands.argument('level', Arguments.FLOAT.create(event)).executes(ctx => {
            let p = ctx.source.player;
            let val = Arguments.FLOAT.getResult(ctx, 'level') / 10;
            p.abilities.setFlyingSpeed(val);
            p.abilities.setWalkingSpeed(val);
            p.onUpdateAbilities();
            p.tell(prefix.copy().append(Text.aqua(`Speed set to: ${val * 10}`)));
            return 1;
        })));

    // VANISH
    event.register(Commands.literal('vanish').requires(s => s.hasPermission(2)).executes(ctx => {
        let p = ctx.source.player;
        if (p.potionEffects.isActive("minecraft:invisibility")) {
            p.potionEffects.clear();
            p.tell(prefix.copy().append(Text.red("👻 You are now visible.")));
        } else {
            p.potionEffects.add("minecraft:invisibility", 2147483647, 0, false, false);
            p.tell(prefix.copy().append(Text.green("👻 You are now invisible!")));
        }
        return 1;
    }));

    // INVSEE
    event.register(Commands.literal('invsee').requires(s => s.hasPermission(2))
        .then(Commands.argument('target', Arguments.PLAYER.create(event)).executes(ctx => {
            //try {
                let target = Arguments.PLAYER.getResult(ctx, 'target');
                ctx.source.player.openMenu(target.inventoryMenu);
                ctx.source.player.tell(prefix.copy().append(Text.gray("Viewing: ")).append(Text.yellow(target.username)));
                return 1;
            /*} catch (e) {
                ctx.source.sendFailure(prefix.copy().append(Text.red("❌ Player not found.")));
                return 0;
            }*/
        })));
});