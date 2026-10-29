export function reporterOption(person) {
    const branch = person?.company?.name || 'All Branches';
    const title = person?.designation || 'Manager';
    const numericId = person?.id && /^\d+$/.test(String(person.id)) ? Number(person.id) : '';
    return {
        value: person.name,
        employeeId: numericId,
        label: `${person.name} (${title}) — [${branch}]`,
    };
}

export function flattenReportingOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.flatMap((opt) => (opt && opt.options ? opt.options : opt));
}

export function buildReportingOptions({
    executiveLeaders,
    departmentEmployees,
    branchManagers,
    managerStaff,
    branchIds,
    deptIds,
}) {
    const groups = [];
    const seenNames = new Set();

    const pushUnique = (list) => {
        const opts = [];
        (list || []).forEach((person) => {
            if (!person?.name || seenNames.has(person.name)) return;
            seenNames.add(person.name);
            opts.push(reporterOption(person));
        });
        return opts;
    };

    const localList = [...(departmentEmployees || [])];
    (branchManagers || []).forEach((emp) => {
        if (!localList.some((e) => e.id && e.id === emp.id)) {
            localList.push(emp);
        }
    });
    (managerStaff || []).forEach((m) => {
        const inDept = deptIds.length > 0 && deptIds.includes(Number(m.department_id));
        const inBranch = branchIds.length > 0 && branchIds.includes(Number(m.company_id));
        if ((inDept || inBranch) && !localList.some((e) => e.id && e.id === m.id)) {
            localList.push(m);
        }
    });

    const localOpts = pushUnique(localList);
    if (localOpts.length) {
        groups.push({ label: 'Selected Branch & Department Managers', options: localOpts });
    }

    const crossOpts = pushUnique(managerStaff);
    if (crossOpts.length) {
        groups.push({ label: 'All Managers & HR (Across All Branches)', options: crossOpts });
    }

    const execOpts = pushUnique(executiveLeaders);
    if (execOpts.length) {
        groups.push({ label: 'Executive Leadership (CEO / Founder / Director)', options: execOpts });
    }

    return groups;
}
