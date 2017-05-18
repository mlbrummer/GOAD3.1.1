package org.molgenis.data.elasticsearch.transaction;

import org.molgenis.data.elasticsearch.index.job.IndexService;
import org.molgenis.data.index.IndexActionRegisterService;
import org.molgenis.data.transaction.DefaultMolgenisTransactionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static java.util.Objects.requireNonNull;

public class IndexTransactionListener extends DefaultMolgenisTransactionListener
{
	private static final Logger LOG = LoggerFactory.getLogger(IndexTransactionListener.class);

	private IndexService rebuildIndexService;
	private IndexActionRegisterService indexActionRegisterService;

	public IndexTransactionListener(IndexService rebuildIndexService,
			IndexActionRegisterService indexActionRegisterService)
	{
		this.rebuildIndexService = requireNonNull(rebuildIndexService);
		this.indexActionRegisterService = requireNonNull(indexActionRegisterService);
	}

	@Override
	public void commitTransaction(String transactionId)
	{
		try
		{
			indexActionRegisterService.storeIndexActions(transactionId);
		}
		catch (Exception ex)
		{
			LOG.error("Error storing index actions for transaction id {}", transactionId, ex);
		}
	}

	@Override
	public void rollbackTransaction(String transactionId)
	{
		try
		{
			indexActionRegisterService.forgetIndexActions(transactionId);
		}
		catch (Exception ex)
		{
			LOG.error("Error forgetting actions for transaction id {}", transactionId, ex);
		}
	}

	@Override
	public void doCleanupAfterCompletion(String transactionId)
	{
		try
		{
			if (indexActionRegisterService.forgetIndexActions(transactionId))
			{
				rebuildIndexService.rebuildIndex(transactionId);
			}
		}
		catch (Exception ex)
		{
			LOG.error("Error during cleanupAfterCompletion", ex);
		}
	}
}
