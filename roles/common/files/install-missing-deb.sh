#!/bin/sh

PKG=$1
export DEBIAN_FRONTEND="noninteractive"

if dpkg --status $PKG > /dev/null 2>&1; then
    exit 0
fi

echo "installing $PKG"
(apt-get --yes update && apt-get --yes install $PKG) > /dev/null 2>&1
exit $?
