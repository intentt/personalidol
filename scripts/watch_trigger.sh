#!/usr/bin/env sh

BASE_DIRECTORY=$(realpath $PWD/../../scripts)
MAKE=$1
WATCH_PATTERN=$2
WATCH_TARGET=$3

. ${BASE_DIRECTORY}/_notify.sh

PACKAGE_NAME=$(basename $(pwd))
PACKAGE_SCOPE="personalidol"
BUILD_NAME="${PACKAGE_SCOPE}/${PACKAGE_NAME}"

LAST=""

inotifywait -mqr -e create,delete,modify,move $WATCH_PATTERN --format "%T %w%f" --timefmt "%F %T" | while read EVENT; do
    if [ "$LAST" != "$EVENT" ]; then
        notify "Triggered" $BUILD_NAME $WATCH_TARGET

        if $MAKE $WATCH_TARGET; then
            notify "Done" $BUILD_NAME $WATCH_TARGET
        else
            notify "Failure" $BUILD_NAME $WATCH_TARGET
        fi
    fi
    LAST=$EVENT
done
