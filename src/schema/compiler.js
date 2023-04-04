import SchemaCompiler from 'knex/lib/schema/compiler.js';
import _ from 'lodash';

class SchemaCompiler_Cassandra extends SchemaCompiler {
	hasTable(tableName) {
		const sanitizedTableName = this.formatter.wrap(tableName).toLowerCase();
		const sql = `SELECT table_name as x FROM system_schema.tables WHERE table_name = '${sanitizedTableName}'${this.schema ? ` AND keyspace_name = '${this.formatter.wrap(this.schema)}'` : ''} ALLOW FILTERING`;
		this.pushQuery({
			sql,
			output: (raw) => {
				const result = _.flatten(raw).shift();
				if (!result || !(result instanceof Object)) {
					return;
				}

				return this.formatter.wrap(String(result.x)) === sanitizedTableName;
			}
		});
	}
}

// module.exports = SchemaCompiler_Cassandra;
export default SchemaCompiler_Cassandra;