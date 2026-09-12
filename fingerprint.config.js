/**
 * The fingerprint decides which binaries may accept an over the air update.
 * Without this, bumping expo.version alone changes it, and every release would
 * refuse its own update. Versions say nothing about native compatibility.
 *
 * @type {import('@expo/fingerprint').Config}
 */
const config = {
  sourceSkips: ['ExpoConfigVersions'],
};

module.exports = config;
