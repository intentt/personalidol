#!/usr/bin/env sh

BASE_DIRECTORY=$(realpath $PWD/../../scripts)
MAKE=$1
WATCH_TARGET=$2
IGNORE_DEPENDENCIES=$3

. ${BASE_DIRECTORY}/_build_dependencies.sh
. ${BASE_DIRECTORY}/_notify.sh

PACKAGE_NAME=$(basename $(pwd))
PACKAGE_SCOPE="personalidol"
BUILD_NAME="${PACKAGE_SCOPE}/${PACKAGE_NAME}"

LAST=""

inotifywait -mqr -e create,delete,modify,move "${PWD}/src" "${PWD}/styles" --format "%T %w%f" --timefmt "%F %T" | while read EVENT; do
    if [ "$LAST" != "$EVENT" ]; then
        notify "Triggered" $BUILD_NAME $WATCH_TARGET

        if [ ! $IGNORE_DEPENDENCIES ]; then
            if ! build_dependencies $BUILD_NAME $PACKAGE_SCOPE $PACKAGE_NAME; then
                notify "Failure while building dependencies" $BUILD_NAME $WATCH_TARGET
                continue
            fi
        fi

        if $MAKE $WATCH_TARGET; then
            notify "Done" $BUILD_NAME $WATCH_TARGET
        else
            notify "Failure" $BUILD_NAME $WATCH_TARGET
        fi
    fi
    LAST=$EVENT
done
