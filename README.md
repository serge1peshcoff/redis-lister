## redis-lister

Command-line tool to monitor Redis keys in realtime.
Useful when you are using Redis as a queue job to monitor your keys, for example. Or for debugging.

**Demo ([full size](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/docs/demo1.gif)):**

![The GIF demo of this app](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/docs/demo1.gif "The GIF demo of this app")

## Features

 - Specify hostname and update interval
 - Specify monitored keys and their types
 - Automatically reconnecting Redis if disconnecting
 - Handling errors correctly (e.g. when the wrong key type is specified)
 - Friendly user-interface (thanks to [blessed](https://github.com/chjj/blessed) and [blessed-contrib](https://github.com/yaronn/blessed-contrib/)!)

## Installation and running

    npm install -g redis-lister
    redis-lister path/to/config.json

## Configuration

The second argument to `redis-lister` should be an absolute or a relative path to JSON configuration file. Check out [the example config](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/config.json).

The fields that are used:
- **host** - A connection string to connect to Redis. Example: `redis://localhost:6379/0`
- **keys** - List of monitored keys. An object.
- **commands** List of custom commands (see below). Not necessary.
- **updateInterval** - A number that specifies an interval (in millisecons - 1000 === 1s) of keys refreshing. Example: `100`.

The `keys` object contains a list of monitored keys, where key name is a Redis key name, and the key value is a Redis command keyword (see the already defined keywords below).
Example:

    "keys": {
      "key1": "zset",
      "key2": "list",
      "key3": "hash",
      "key4": "string"
      "key5": "set",
    },

If the config is wrong, an error will be thrown.

## How does it work?
This tool sends a `batch` query to a Redis server each `updateInterval` milliseconds. After that, it uses `blessed` and `blessed-contrib` to display the result.
The prefedined commands keywords are :
 - **get** - `GET name`
 - **hlen** - `HLEN name`
 - **llen** - `LLEN name`
 - **scard** - `SCARD name`
 - **zrange** - `ZRANGE name -inf +inf`

If the key contains a value of the wrong type, the error message will be dislayed instead of the result.
Note that the `LIST name` command returns `null` if the key is not set, while other commands return `0`.

You can define your own commands by settig the `commands` field, where the key is the command keyword and the value is a command (`%NAME%` is replaced by key name). Example:

    "commands": {
      "listitems": "lrange %name% 0 -1"
    },
    "keys": {
      "list": "listitems"
    }

## Dependencies

- `blessed` and `blessed-contrib` - for the fancy UI
- `redis` - for Redis connection and fetching data.
- `moment` - for displaying timestamps
- `colors` - for fancy colored log output


