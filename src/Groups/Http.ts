import { ApiBuilder } from "@effect/platform"
import { api } from "../Api.js"
import { Effect, Layer, pipe } from "effect"
import { policyUse } from "../Domain/Policy.js"
import { CurrentUser } from "../Domain/User.js"
import { makeSecurity } from "../Api/Security.js"
import { Groups } from "../Groups.js"
import { GroupsPolicy } from "./Policy.js"
import { Accounts } from "../Accounts.js"

export const HttpGroupsLive = ApiBuilder.group(api, "groups", (handlers) =>
  Effect.gen(function* () {
    const groups = yield* Groups
    const policy = yield* GroupsPolicy
    const security = yield* makeSecurity

    return handlers.pipe(
      ApiBuilder.handle("create", ({ payload }) =>
        CurrentUser.pipe(
          Effect.flatMap((user) => groups.create(user.accountId, payload)),
          policyUse(policy.canCreate(payload)),
        ),
      ),
      ApiBuilder.handle("update", ({ payload, path }) =>
        groups.with(path.id, (group) =>
          pipe(
            groups.update(group, payload),
            policyUse(policy.canUpdate(group)),
          ),
        ),
      ),
      ApiBuilder.middleware(security),
    )
  }),
).pipe(
  Layer.provide(Accounts.Live),
  Layer.provide(Groups.Live),
  Layer.provide(GroupsPolicy.Live),
)