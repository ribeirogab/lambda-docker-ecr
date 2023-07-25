exports.handler = async event => {
  console.log('Running...')

  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Lambda!' })
  }

  return response
}
