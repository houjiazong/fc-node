const os = require('os')
const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

async function getCurrentWeather(location, unit = "fahrenheit") {
  console.log(`Getting weather info for ${location}...`)
  // 模拟等待过程
  await wait(3000)
  let weather_info = {
    location: location,
    temperature: 'unknown',
    unit: unit,
  };

  if (location.toLowerCase().includes('tokyo')) {
    weather_info = { location: 'Tokyo', temperature: '10', unit: 'celsius' };
  } else if (location.toLowerCase().includes('san francisco')) {
    weather_info = {
      location: 'San Francisco',
      temperature: '72',
      unit: 'fahrenheit',
    };
  } else if (location.toLowerCase().includes('paris')) {
    weather_info = { location: 'Paris', temperature: '22', unit: 'fahrenheit' };
  }

  return JSON.stringify(weather_info);
}

module.exports.Description = 'Get the current weather in a given location'
module.exports.Argument = {
  location: {
    type: 'string'
  },
  unit: {
    type: 'string',
    enum: ['celsius', 'fahrenheit']
  },
}

module.exports.handler = async (ctx) => {
  const arg = ctx.ReadLLMArguments()
  const result = await getCurrentWeather(arg.location, arg.unit)
  ctx.WriteLLMResult(result)
}