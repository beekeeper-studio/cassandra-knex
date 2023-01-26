import Client from 'knex/lib/client.js';
import { promisify } from 'node:util';
import SchemaCompiler from './schema/compiler.js';
import QueryCompiler from './query/querycompiler.js';
import ColumnCompiler from './schema/columncompiler.js';
import TableCompiler from './schema/tablecompiler.js';
import cassandra_driver from 'cassandra-driver';

//TEMP@DAY
function TODO() {
	return new Error('This functionality has not been implemented yet!!!');
}

class Client_Cassandra extends Client {
	_driver() {
		return cassandra_driver;
	}

	schemaCompiler() {
		return new SchemaCompiler(this, ...arguments);
	}

	queryCompiler(builder, formatter) {
		return new QueryCompiler(this, builder, formatter);
	}

	columnCompiler() {
		return new ColumnCompiler(this, ...arguments);
	}

	// columnBuilder() {
	// 	throw TODO();
	// }

	tableCompiler() {
		return new TableCompiler(this, ...arguments);
	}

	transaction() {
		throw TODO();
	}

	wrapIdentifierImpl(value) {
		return value;
		// throw TODO();
		//TODO@DAY this function seems to be completely useless in the firebird implementation?! Investigate further
	}

	// get a raw connection, called by the `pool` whenever a new
	// connection needs to be added to the pool.
	// NOTE@DAY it seems that cassandra-driver already handles connection pooling, so we may be able to get around this completely?
	// (we may also have to figure out a way to fake it so that knex doesn't get angry)
	acquireRawConnection() {
		return new Promise((resolve, reject) => {
			const connection = new this.driver.Client(this.connectionSettings);
			connection.connect()
				.then(() => {
					console.log('Connected to cluster with %d host(s): %j', connection.hosts.length);
					resolve(connection);				
				})
				.catch((err) => {
					console.error('There was an error while connecting', err);
					reject(err);
				});
		});
	}

	async destroyRawConnection(connection) {
		return new Promise((resolve, reject) => {
			connection.shutdown()
				.then(() => resolve())
				.catch((err) => reject(err));
		});
	}

	// NOTE@DAY skipping over some functions here

	//Runs a query on the specified connection, providing the bindings and any other necessary prep work.
	_query(connection, obj) {
		if (!obj || typeof obj === 'string') obj = { sql: obj };
		if (!obj.sql) throw new Error('The query is empty');

		return new Promise((resolve, reject) => {
			if (!obj.sql) {
				resolve();
				return;
			}
			if (!obj.options) obj.options = {};
			obj.options.prepare = true;
			connection.execute(
				obj.sql,
				obj.bindings,
				obj.options,
				(err, result) => {
					if (err) return reject(err);
					//needs to be formatted as [rows, fields]
					obj.response = [result.rows, result.columns];
					resolve(obj);
				}
			);
		});
	}

	async processResponse(obj, runner) {
		if (!obj) return;

		const { response, method } = obj;
		if (obj.output) {
			return obj.output.call(runner, response);
		}

		const [rows, fields] = response;
		// TODO@Day fixBlobCallbacks?

		switch (method) {
			case 'first':
				return rows[0];
			default:
				return rows;
		}
	}
}

Object.assign(Client_Cassandra.prototype, {
	requestQueue: [],
	dialect: 'cassandra',
	driverName: 'cassandra-driver'
});

// module.exports = Client_Cassandra;
export default Client_Cassandra;