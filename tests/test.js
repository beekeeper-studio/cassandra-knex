// Tests here
import { GenericContainer, Network } from 'testcontainers';
import CassandraKnex from '../src/index.js';
import knexLib from 'knex';
import { jest } from '@jest/globals';

describe('Apache Cassandra dialect', () => {
	let container;
	let network;
	let cassKnex;
	const dbTimeout = 120000;
	const timeoutDefault = 5000;
	const keyspaceName = 'cassandra_knex_test';
	jest.setTimeout(dbTimeout);
	beforeAll(async () => {
		container = await new GenericContainer('cassandra')
			.withName('testcassandra')
			.withExposedPorts(9042)
			.withStartupTimeout(dbTimeout)
			.start();

		jest.setTimeout(timeoutDefault);
		
		cassKnex = knexLib({
		  client: CassandraKnex,
		  connection: {
				// HACK@DAY This should be taken from the container, but it is refusing to connect if I grab the IP from the container.
				contactPoints: [`localhost:${container.getMappedPort(9042)}`],
		    localDataCenter: 'datacenter1',
		  }
		});

		const connection = await cassKnex.context.client.acquireConnection();

		await connection.execute(`CREATE KEYSPACE ${keyspaceName} WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }`);
	});

	afterAll(async () => {
		// stop client?
		const connection = await cassKnex.context.client.acquireConnection();
		await connection.execute(`DROP KEYSPACE ${keyspaceName};`)
		await container.stop();
	});

	describe('Create Table', () => {
		it('with simple primary key', async () => {
			const query = cassKnex.schema.withSchema(keyspaceName).createTable('KnexTest', table => {
				table.string('stringCol');
				table.integer('intCol');
				table.primary('intCol');
			});
			
			// primary key is being generated properly
			const { sql } = query.toSQL()[0];
			expect(sql.includes('PRIMARY KEY (intCol)'))
			// ensure the query actually runs
			await query;
			
			// the table was actually created
			expect(await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTest'));
		});

		it('with complex primary key', async () => {
			const query = cassKnex.schema.withSchema(keyspaceName).createTable('KnexTestComplex', table => {
				table.string('stringCol');
				table.integer('intCol');
				table.integer('intCol2');
				table.primary(['intCol', 'stringCol', 'intCol2'], { lastPartitionKey: 1 });
			});

			// primary key is being generated properly
			const { sql } = query.toSQL()[0];
			expect(sql.includes('PRIMARY KEY((intCol, stringCol), intCol2)'));
			// ensure the query actually runs.
			await query;

			// the table was actually created.
			expect(await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTestComplex'));
		});
	});

	describe('Perform operations on rows.', () => {
		it('Insert One row', async () => {
			const query = cassKnex('KnexTest').withSchema(keyspaceName).insert({stringCol: 'knex test col 1', intCol: 1});

			// one query should have been built
			let { sql } = query.toSQL();
  		expect([...sql.matchAll(/insert into/g)].length).toBe(1);
			
			// ensure the query runs
			await query;
		});

		it('Select one row', async () => {
			const record = (await cassKnex('KnexTest').withSchema(keyspaceName).select().where('intCol', '=', 1))[0];
			expect(record.intcol).toBe(1);
			expect(record.stringcol).toBe('knex test col 1');
		})
		
		it('Insert multiple rows at once', async () => {
		  const query = cassKnex('knexTest').withSchema(keyspaceName).insert([
		    {stringCol: 'this is a knex test', intCol: 2},
		    {stringCol: 'yeet', intCol: 3},
		    {stringCol: 'ANOTHER!', intCol: 4}
		  ]);

			// we should have multiple insert statements
			let { sql } = query.toSQL();
			expect([...sql.matchAll(/insert into/g)].length).toBe(3);

			// run the query
			await query;
		});

		it('Select multiple rows with a where clause', async () => {
			const records = await cassKnex('KnexTest').withSchema(keyspaceName).select().where('intCol', '>', 2);
			expect(records.length).toBe(2);
			expect(records.some(x => x.intcol != 3 && x.intcol != 4)).not;
		});

		it('Select with a limit', async () => {
			const records = await cassKnex('KnexTest').withSchema(keyspaceName).select().limit(3);
			expect(records.length).toBe(3);
		});

		it('Update a row', async () => {
			const colValue = 'UPDATED IN THIS TEST';
			await cassKnex('KnexTest')
				.withSchema(keyspaceName)
				.where('intCol', '=', 1)
				.update({ stringCol: colValue});

			const record = (await cassKnex('KnexTest').withSchema(keyspaceName).select().where('intCol', '=', 1))[0];
			expect(record.stringcol).toBe(colValue);
		});

		it('Update multiple rows', async () => {
			const colValue = 'BOTH UPDATED IN ONE STATEMENT';
			await cassKnex('KnexTest')
				.withSchema(keyspaceName)
				.whereIn('intCol', [2, 3])
				.update({ stringCol: colValue });

			const records = await cassKnex('KnexTest').withSchema(keyspaceName).select().whereIn('intCol', [2, 3]);
			expect(records.length).toBe(2);
			expect(records[0].stringcol).toBe(colValue);
			expect(records[1].stringcol).toBe(colValue);
		})
	});

	it('Drop Tables', async () => {
		expect(await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTest'));
		await cassKnex.schema.withSchema(keyspaceName).dropTable('KnexTest');
		expect(!await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTest'));
		
		expect(await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTestComplex'));
		await cassKnex.schema.withSchema(keyspaceName).dropTable('KnexTestComplex');
		expect(!await cassKnex.schema.withSchema(keyspaceName).hasTable('KnexTestComplex'));
	})
});
