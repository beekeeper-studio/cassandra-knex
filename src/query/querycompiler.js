// Query compiler
import QueryCompiler from 'knex/lib/query/querycompiler.js';
import assert from 'assert';

class QueryCompiler_Cassandra extends QueryCompiler {
	constructor(client, builder, formatter) {
		super(client, builder, formatter);

		const { returning } = this.single;
		if (returning) {
			this.client.logger.warn(
				'.returning() is not supported by cassandra and will not have any effect.'
			);
		}

		this._emptyInsertValue = '() values ()';
	}

	update() {
		const updates = this._prepUpdate(this.single.update);
		const where = this.where();
		//TODO@DAY add suport for using
		return (
			`UPDATE ${this.tableName} SET ${updates.join(', ')}` +
			(where ? ` ${where}` : '')
		);
	}

	limit() {
		const noLimit = !this.single.limit && this.single.limit !== 0;
		if (noLimit) return '';

		return `limit ${this._getValueorParameterFromAttribute('limit')}`;
	}

	// validation that can be worked on later.
	// whereBasic(statement) {
	// 	assert(!isPlainObjectOrArray(statement.value), 'The values in where clause must not be object or array.');

	// 	return super.whereBasic(statement);
	// }

	// whereRaw(statement)

	
}

// module.exports = QueryCompiler_Cassandra;
export default QueryCompiler_Cassandra;
