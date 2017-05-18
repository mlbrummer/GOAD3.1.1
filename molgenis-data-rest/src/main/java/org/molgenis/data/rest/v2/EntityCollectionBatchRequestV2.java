package org.molgenis.data.rest.v2;

import com.google.auto.value.AutoValue;
import org.hibernate.validator.constraints.NotEmpty;
import org.molgenis.gson.AutoGson;

import javax.validation.constraints.Size;
import java.util.List;
import java.util.Map;

@AutoValue
@AutoGson(autoValueClass = AutoValue_EntityCollectionBatchRequestV2.class)
public abstract class EntityCollectionBatchRequestV2
{
	@NotEmpty(message = "Please provide at least one entity in the entities property.")
	@Size(max = RestControllerV2.MAX_ENTITIES, message = "Number of entities cannot be more than {max}.")
	public abstract List<Map<String, Object>> getEntities();

	@Override
	public int hashCode()
	{
		// See #3897. If hashCode fails, the validation throws an exception
		if (getEntities() == null)
		{
			return 0;
		}
		return super.hashCode();
	}
}