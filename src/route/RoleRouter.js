const router = require("express").Router();

const assignRoleBody = require("../model/role/AssignRoleBody").assignRoleBody
const { userRole } = require("../service/sql/AuthDb").userRole
const { assignRole } = require("../service/sql/AuthDb").assignRole
const { decodeJwt } = require('jwtdecode');


router.post("/assign", async (req, res) => {
    const { error, value: { authMediumUserName, role: newRole, bearerToken } } = assignRoleBody.validate(req.body);

    if (!error) {
        try {
            const decodedBearerToken = await decodeJwt(bearerToken);
            const myRole = decodedBearerToken.role;
            if(!myRole) throw new Error("your bearer token doesn't contain your role")
            try {
                const { userId, role: oldRole } = await userRole(authMediumUserName);
                // Hierarchy mapping
                const hierarchy = {
                    OWNER: 4,
                    ADMIN: 3,
                    EDITOR: 2,
                    USER: 1
                };

                // Edge cases and validations
                if (oldRole === "OWNER" || newRole === "OWNER") {
                    return res.status(403).json({ message: "Owner role cannot be changed or assigned." });
                }

                if (hierarchy[newRole] > hierarchy[myRole]) {
                    return res.status(403).json({
                        message: `You dont have the authority to make someone ${newRole} role.`
                    });
                }

                if (hierarchy[oldRole] > hierarchy[myRole]) {
                    return res.status(403).json({
                        message: `You cannot change roles of users with ${oldRole}.`
                    });
                }

                if (newRole === oldRole) {
                    return res.status(400).json({ message: "The new role is the same as the old role. No changes made." });
                }
                
                try {
                    await assignRole(newRole,userId);
                    return res.status(200).json({ message: "Role assigned successfully." });
                }catch (error){
                    res.status(500).json({message : error.message})
                }

            } catch (error) {
                res.status(404).json({message : error.message});
            }
        } catch (error) {
            res.status(403).json({ message: error.message });
        }
    } else {
        res.status(400).json({ message: "Validation error: " + error.message });
    }
});




module.exports.roleRouter = router;