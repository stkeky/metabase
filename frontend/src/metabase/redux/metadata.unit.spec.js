import Fields from "metabase/entities/fields";
import Tables from "metabase/entities/tables";

import { fetchField, loadMetadataForDependentItems } from "./metadata";

describe("deprecated metadata actions", () => {
  let dispatch;
  beforeEach(() => {
    jest.clearAllMocks();

    dispatch = jest.fn(a => a);
  });

  describe("fetchField", () => {
    it("should fetch a field", async () => {
      Fields.actions.fetch = jest.fn(() =>
        Promise.resolve({
          type: Fields.actionTypes.FETCH_ACTION,
          payload: {
            result: 0,
            entities: {
              fields: {
                0: { id: 0 },
              },
            },
          },
        }),
      );

      await fetchField(0, false)(dispatch);
      expect(Fields.actions.fetch).toHaveBeenCalledWith(
        { id: 0 },
        { reload: false },
      );
      expect(Fields.actions.fetch.mock.calls.length).toBe(1);
    });

    it("should fetch the field associated with a field's dimensions.human_readable_field_id property", async () => {
      Fields.actions.fetch = jest.fn();

      Fields.actions.fetch.mockReturnValueOnce(
        Promise.resolve({
          type: Fields.actionTypes.FETCH_ACTION,
          payload: {
            result: 0,
            entities: {
              fields: {
                0: { id: 0, dimensions: [{ human_readable_field_id: 1 }] },
              },
            },
          },
        }),
      );

      Fields.actions.fetch.mockReturnValueOnce(
        Promise.resolve({
          type: Fields.actionTypes.FETCH_ACTION,
          payload: {
            result: 1,
            entities: {
              fields: {
                0: { id: 0, dimensions: [{ human_readable_field_id: 1 }] },
                1: { id: 1 },
              },
            },
          },
        }),
      );

      await fetchField(0, true)(dispatch);
      expect(Fields.actions.fetch).toHaveBeenCalledWith(
        { id: 0 },
        { reload: true },
      );
      expect(Fields.actions.fetch).toHaveBeenCalledWith(
        { id: 1 },
        { reload: true },
      );
      expect(Fields.actions.fetch.mock.calls.length).toBe(2);
    });
  });

  describe("loadMetadataForDependentItems", () => {
    beforeEach(() => {
      Fields.actions.fetch = jest.fn(() =>
        Promise.resolve({
          type: Fields.actionTypes.FETCH_ACTION,
          payload: {},
        }),
      );

      Tables.actions.fetchMetadata = jest.fn(() =>
        Promise.resolve({
          type: Tables.actionTypes.FETCH_METADATA,
          payload: {},
        }),
      );

      Tables.actions.fetchMetadataAndForeignTables = jest.fn(() =>
        Promise.resolve({
          type: Tables.actionTypes.FETCH_TABLE_METADATA,
          payload: {},
        }),
      );
    });

    it("should send requests for any tables/fields needed by the query", () => {
      const dependentItems = [
        { type: "table", id: 1 },
        { type: "table", id: 1 },
        { type: "table", id: 2 },
        { type: "field", id: 3 },
      ];

      loadMetadataForDependentItems(dependentItems)(dispatch);
      expect(Tables.actions.fetchMetadataAndForeignTables).toHaveBeenCalledWith(
        { id: 1 },
        undefined,
      );
      expect(Tables.actions.fetchMetadataAndForeignTables).toHaveBeenCalledWith(
        { id: 2 },
        undefined,
      );
      expect(
        Tables.actions.fetchMetadataAndForeignTables,
      ).toHaveBeenCalledTimes(2);

      expect(Fields.actions.fetch).toHaveBeenCalledWith({ id: 3 }, undefined);
    });
  });
});
