~/.TrenchBroom/games/PersonalIdol:
	mkdir -p ~/.TrenchBroom/games/PersonalIdol

~/.TrenchBroom/games/PersonalIdol/GameConfig.cfg: ~/.TrenchBroom/games/PersonalIdol ./GameConfig.cfg
	install ./GameConfig.cfg ~/.TrenchBroom/games/PersonalIdol/GameConfig.cfg

~/.TrenchBroom/games/PersonalIdol/PersonalIdol.fgd: ~/.TrenchBroom/games/PersonalIdol ./PersonalIdol.fgd
	install ./PersonalIdol.fgd ~/.TrenchBroom/games/PersonalIdol/PersonalIdol.fgd

.PHONY: install
install: ~/.TrenchBroom/games/PersonalIdol/GameConfig.cfg ~/.TrenchBroom/games/PersonalIdol/PersonalIdol.fgd
