import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env file
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL in environment variables')
  process.exit(1)
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables')
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file')
  console.error('You can find it in your Supabase project settings under API > Service Role Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function generateTypes() {
  try {
    console.log('Fetching database schema from Supabase...')

    // Try using RPC first, but fallback to manual if not available
    let data = null
    try {
      const response = await supabase.rpc('get_schema_tables')
      if (response?.data) {
        data = response.data
      }
    } catch (rpcError) {
      // RPC not available, continue to manual approach
    }

    if (data) {
      await generateFromRPC(data)
    } else {
      console.log('Using direct introspection approach...')
      await generateFromIntrospection()
    }
  } catch (error) {
    console.error('Error generating types:', error)
    process.exit(1)
  }
}

async function generateFromIntrospection() {
  try {
    console.log('Fetching schema from Supabase API...')
    
    // Use Supabase's REST API to get table definitions
    const response = await fetch(
      `${supabaseUrl}/rest/v1/?apikey=${supabaseServiceKey}`,
      { headers: { 'Accept': 'application/vnd.pgrst.object+json' } }
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    // Alternative: Query the tables directly
    const { data: tables, error } = await supabase
      .rpc('get_tables_with_columns')
      .then(r => ({ data: r.data, error: r.error }))
      .catch(() => ({ data: null, error: 'RPC not available' }))

    if (tables) {
      await generateFromRPC(tables)
      return
    }

    // Fallback: Just use the hardcoded types we know exist
    console.log('Using local type definitions...')
    await generateManualTypes()
  } catch (error) {
    console.warn('Introspection failed:', error.message)
    await generateManualTypes()
  }
}

async function generateManualTypes() {
  console.log('\n⚠️  For automatic type generation, you have two options:\n')
  console.log('Option 1: Use Supabase Dashboard')
  console.log('  1. Go to your Supabase dashboard')
  console.log('  2. Click "TypeScript" in the table list')
  console.log('  3. Copy the generated types\n')

  console.log('Option 2: Use supabase-js with manual declarations')
  console.log('  Add SUPABASE_SERVICE_ROLE_KEY to .env.local file\n')

  console.log('For now, creating a template database.ts file...\n')

  const template = `// Auto-generated Supabase types
// To regenerate, run: npm run generate:types
// Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env.local file

export interface Profiles {
  id: string
  user_id: string
  name: string
  surname: string
  created_at: string
}

// Add your other tables here as you create them
`

  const outputPath = path.resolve(__dirname, '../src/types/database.ts')
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, template)
  console.log(`✅ Template created at ${outputPath}`)
}

async function generateFromRPC(data) {
  let typesContent = '// Auto-generated Supabase types\n\n'

  for (const table of data || []) {
    const tableName = table.table_name
    const interfaceName = tableNameToInterface(tableName)

    typesContent += `export interface ${interfaceName} {\n`

    if (table.columns) {
      for (const column of table.columns) {
        const isOptional = column.is_nullable ? '?' : ''
        const tsType = mapPostgresToTs(column.data_type)
        typesContent += `  ${column.column_name}${isOptional}: ${tsType}\n`
      }
    }

    typesContent += '}\n\n'
  }

  const outputPath = path.resolve(__dirname, '../src/types/database.ts')
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, typesContent)
  console.log(`✅ Types generated successfully at ${outputPath}`)
}

function tableNameToInterface(tableName) {
  return tableName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function mapPostgresToTs(postgresType) {
  const typeMap = {
    'character varying': 'string',
    varchar: 'string',
    text: 'string',
    integer: 'number',
    bigint: 'number',
    smallint: 'number',
    numeric: 'number',
    'double precision': 'number',
    boolean: 'boolean',
    timestamp: 'string',
    'timestamp without time zone': 'string',
    'timestamp with time zone': 'string',
    date: 'string',
    time: 'string',
    uuid: 'string',
    json: 'any',
    jsonb: 'any',
  }

  return typeMap[postgresType?.toLowerCase()] || 'any'
}

generateTypes()
