-- 重置所有表的SEED
declare c_a cursor for SELECT name FROM sys.sysobjects WHERE type='U';

declare @id nvarchar(100);
declare @sql nvarchar(1000);
open c_a;


fetch next from c_a into @id;
while @@fetch_status=0
begin
   set @sql='DBCC CHECKIDENT ("'+@id+'", RESEED)';
   exec sp_executesql @sql
   fetch next from c_a into @id;
end;
close c_a;
deallocate c_a; 





--- 让数据库离线，被占用

--- 还原前离线

use master

alter database databasename set offline with rollback immediate;

--- 手动恢复数据库

--- 还原后恢复

use master

alter database databasename set online with rollback immediate;