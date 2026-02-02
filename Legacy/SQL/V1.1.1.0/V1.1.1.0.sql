-- 20251112
alter table TM_CPY_ClientInvoice_Payment add cpy_payment_code nvarchar(200) null;
GO

insert into TR_LTP_Line_Type values ('TRANSPORT, LOGISTIC, STORAGE AND QUALITY CONTROL','',1);
GO

insert into TR_CTY_Client_Type values ('Délégataire');
GO

create table TR_CDL_Client_Delegate
(
	cdl_id				int identity(1,1)		primary key,
    cli_id				int						not null constraint FK_CDL_CLI1 foreign key(cli_id) references TM_CLI_CLIENT(cli_id),
    cli_delegate_id		int						not null constraint FK_CDL_CLI2 foreign key(cli_id) references TM_CLI_CLIENT(cli_id)
)
GO

alter table TM_CIN_Client_Invoice add cin_delegator_id int null constraint FK_CIN_DEL foreign key(cli_id)  references TM_CLI_CLIENT(cli_id)
GO

/********* 20251128 The above content is already running on the server. **********/

---- TO RUN 20251208

-- A customer can have multiple roles at the same time.
create table TR_CTL_ClientTYPE_LIST
(
    ctl_id	            int identity(1,1)		primary key,
    cli_id	            int                     not null constraint FK_CTL_CLI foreign key (cli_id) references TM_CLI_CLIENT(cli_id),
    cty_id              int                     not null constraint FK_CTL_CTY foreign key (cty_id) references TR_CTY_Client_Type(cty_id)
)
GO

insert into TR_CTL_ClientTYPE_LIST
select cli_id, cty_id from TM_CLI_CLient
GO

/********* 20251216 The above content is already running on the server. **********/