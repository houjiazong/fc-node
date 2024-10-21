const vm = require('node:vm')
const path = require('node:path')
const fs = require('node:fs')

function getScriptPath () {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Please provide a file name as an argument.');
    process.exit(1);
  }
  return path.resolve(args[0])
}

function loadModule (scriptPath) {
  return require(scriptPath)
}

function generateCode (scriptPath) {
  return `
    (async () => {
      const { handler } = require('${scriptPath}')
      return await handler(this.ctx)
    })()
  `
}

async function checkFunctionValid (scriptPath) {
  const scriptBuffer = await fs.readFileSync(scriptPath)
  const script = scriptBuffer.toString()
  // todo: 做一些校验
  // ...
  return ![`'os'`].some(item => script.includes(item))
}

async function runFunctionCalling (ctx, scriptPath) {
  const functionValid = await checkFunctionValid(scriptPath)

  if (!functionValid) {
    throw Error(`invalid function`)
  }

  const result = await new Promise((resolve, reject) => {
    const sandbox = {
      require,
      console,
      ctx
    }

    try {
      vm.createContext(sandbox)

      const data = vm.runInNewContext(generateCode(scriptPath), sandbox)

      resolve(data)
    } catch (error) {
      reject(error)
    }
  }).catch((err) => {
    return err instanceof Error ? err : new Error(err.stack)
  })
  return result
}

function generateTools (Description, Argument) {
  if (!Description || !Argument) {
    throw Error('The declared Description and Argument must be exported as a module')
  }
  return [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: Description,
        parameters: {
          type: 'object',
          properties: Argument,
          required: Object.keys(Argument),
        },
      },
    },
  ]
}

async function main () {
  const scriptPath = getScriptPath()
  const { Description, Argument } = loadModule(scriptPath)
  const tools = generateTools(Description, Argument)
  const messages = [
    {
      role: "user",
      content: "What's the weather like in San Francisco, Tokyo, and Paris?",
    },
  ]
  // 模拟与 yomo 通信获取第一次响应结果
  // 传递tools及messages
  const mockResponseMessage = {
    role: 'assistant',
    tool_calls: [
      {
        id: '1',
        type: 'function',
        function: {
          arguments: `{
            "location": "San Francisco",
            "unit": "celsius"
          }`,
        }
      },
      {
        id: '2',
        type: 'function',
        function: {
          arguments: `{
            "location": "Tokyo",
            "unit": "celsius"
          }`,
        }
      },
      {
        id: '3',
        type: 'function',
        function: {
          arguments: `{
            "location": "Paris",
            "unit": "celsius"
          }`,
        }
      },
    ],
  }
  if (mockResponseMessage.tool_calls) {
    messages.push(mockResponseMessage)
    await Promise.all(mockResponseMessage.tool_calls.map(item => {
      return runFunctionCalling({
        ReadLLMArguments: () => {
          const args = JSON.parse(item.function.arguments)
          return args
        },
        WriteLLMResult: (result) => {
          messages.push({
            role: 'tool',
            content: result,
          })
        }
      }, scriptPath)
    }))
    // 模拟与 yomo 的第二次通信
    // 传递 messages
  }
  console.log('final messages: ', messages)
}

main()