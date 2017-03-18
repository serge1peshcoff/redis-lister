## redis-lister

Command-line tool to monitor Redis keys in realtime.
Useful when you are using Redis as a queue job, for example.

**Demo ([full size](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/docs/demo1.gif)):**

![The GIF demo of this app](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/docs/demo1.gif "The GIF demo of this app")

## Features

 - Specify hostname and update interval
 - Specify monitored keys and their types
 - Automatically reconnecting Redis if disconnecting
 - Handling errors correctly (e.g. when the wronk key type is specified)
 - Friendly user-interface (thanks to [blessed](https://github.com/chjj/blessed) and [blessed-contrib](https://github.com/yaronn/blessed-contrib/)!)

## Installation and running

    npm install -g redis-lister
    redis-lister path/to/config.json

## Configuration

The second argument to `redis-lister` should be an absolute or a relative path to JSON configuration file. Check out [the example config](https://raw.githubusercontent.com/serge1peshcoff/redis-lister/master/config.json).

The fields that are used:
- **host** - A connection string to connect to Redis. Example: `redis://localhost:6379/0`
- **keys** - List of monitored keys. An object.
- **updateInterval** - A number that specifies an interval (in millisecons - 1000 === 1s) of keys refreshing. Example: `100`.

The `keys` object contains a list of monitored keys, where key name is a Redis key name, and the key value is the Redis key type, one of those: `string`, `hash`, `list`, `zset`. Example:

    "keys": {
      "key1": "zset",
      "key2": "list",
      "key3": "hash",
      "key4": "string"
    },

If the config is wrong, an error will be thrown.

## How does it work?
This tool sends a `batch` query to a Redis server each `updateInterval` milliseconds. After that, it uses `blessed` and `blessed-contrib` to display the result.
The commands that are used to get key info are dependent on a key type:
 - **string** - `LIST name`
 - **hash** - `HLEN name`
 - **list** - `LLEN name`
 - **zset** - `ZRANGE name -inf +inf`

If the key contains a value of the wront type, the error message will be dislayed instead of the result.
Note that the `LIST name` command returns `null` if the key is not set, while other commands return `0`.

## Dependencies

- `blessed` and `blessed-contrib` - for the fancy UI
- `redis` - for Redis connection and fetching data.
- `moment` - for displaying timestamps


