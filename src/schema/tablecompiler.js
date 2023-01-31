import TableCompiler from 'knex/lib/schema/tablecompiler.js';
import { isObject } from 'knex/lib/util/is.js';
import pkg from 'lodash';
const { isString } = pkg

class TableCompiler_Cassandra extends TableCompiler {
	// Create a new table.
	createQuery(columns, ifNot) {
		if (ifNot) throw new Error('createQuery ifNot not implemented');
		else if (!columns.sql.some(x => x.includes('PRIMARY KEY'))) throw new Error('Tables must have a primary key!!');
		// NOTE@rathboma tableName() wraps identifiers already, there is a columnize function that's supposed to wrap
		// columns for us, but it was giving me a lot of trouble.
		let sql = `CREATE TABLE ${this.tableName()} (${columns.sql.join(', ')})`;

		this.pushQuery(sql);
		//TODO@DAY add support for table options.
	}

	//TODO@DAY Index, comment, alterColumns, dropColumn, renameColumn, dropIndex, dropPrimary?
	// columns should start with all of the partition keys
	// adding lastPartitionKey to the `options` argument, which will be the index of the last entry for the partition key 
	primary(columns, constraintName) {
		let deferrable, lastPartitionKey;
		if (isObject(constraintName)) {
			({ constraintName, deferrable, partitionKey: lastPartitionKey } = constraintName);
		}
		if (deferrable && deferrable !== 'not deferrable') {
			this.client.logger.warn(
				`cassandra: primary key constraint [${constraintName}] will not be deferrable ${deferrable} because Cassandra does not support deferred constraints.`
			);
		}

		let partitions = []
		if (lastPartitionKey && !isString(columns)) {
			partitions = columns.slice(0, lastPartitionKey + 1);
			columns = columns.slice(lastPartitionKey + 1);
		} else if (isString(columns)) {
			columns = [ columns ];
		}

		let partitionStr = '';
		if (partitions.length > 0) {
			partitionStr = `(${partitions.join(', ')}), `
		}

		if (!this.forCreate) {
			throw new Error('Cassandra does not support altering primary keys.');
		} else {
			const tablePrimaryKey = `PRIMARY KEY (${partitionStr}${columns.join(', ')})`;
			this.pushQuery(tablePrimaryKey, columns);
		}
	}

	addColumns(columns, prefix = this.addColumnsPrefix) {
		if (columns.sql.length > 0) {
			this.pushQuery({
				sql: `ALTER TABLE ${this.tableName()} ${prefix} (${columns.sql.join(', ')})`,
				bindings: columns.bindings
			});
		}
	}

}

TableCompiler_Cassandra.prototype.createAlterTableMethods = ['primary'];
TableCompiler_Cassandra.prototype.lowerCase = false;
TableCompiler_Cassandra.prototype.addColumnsPrefix = 'ADD';
// TableCompiler_Cassandra.prototype.
// TableCompiler_Cassandra.prototype.

// module.exports = TableCompiler_Cassandra;
export default TableCompiler_Cassandra;
