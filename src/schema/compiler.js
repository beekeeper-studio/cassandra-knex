import SchemaCompiler from 'knex/lib/schema/compiler.js';
import pkg from 'lodash';
const { flatten } = pkg;

class SchemaCompiler_Cassandra extends SchemaCompiler {
	hasTable(tableName) {
		const sql = `SELECT table_name as x FROM system_schema.tables WHERE table_name = ${String(tableName)}${this.schema ? 'AND keyspace_name = ' + this.schema : ''} ALLOW FILTERING`;
		this.pushQuery({
			sql,
			output: (raw) => {
				const result = flatten(raw).shift();
				if (!result || !(result instanceof Object)) {
					return;
				}

				return String(result.x) === String(tableName);
			}
		});
	}
}

function prefixedTableName(prefix, table) {
	return prefix ? `${prefix}.${table}` : table;
}

// module.exports = SchemaCompiler_Cassandra;
export default SchemaCompiler_Cassandra;