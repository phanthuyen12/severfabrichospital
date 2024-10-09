const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class OrgChaincode extends Contract {

  // Khởi tạo ledger với dữ liệu mẫu
  async initLedger(ctx) {
    const organizations = [{
      nameorg: "hostbenh",
      nameadmin: 'phangiathuyen',
      emailadmin: 'thuyendi2004@gmail.com',
      addressadmin: '48/5btokyquan12',
      phoneadmin: '0869895748',
      businessBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAADTz',
      tokeorg: 'orgToken123',
      statusOrg: 'false',
      hospitalbranch: [],
      users: [
        {
          fullname: 'thuyendi2004@gmail',
          address: '48/5btokyquan12',
          organizationalvalue: '432545354',
          phone: '0869895748',
          typeusers: 'admin',
          branch:'sdfsdfsdf',
          imgidentification:'sdfiughys89dfy9sd8sdfsdfds',
          cccd: '0869895748',
          password: 'djfhdkjfhdfkjg',
          tokenuser: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          timecreats: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          historyUser: [],
        }
      ],
      historyOrg: [] // Thêm trường lịch sử cho tổ chức
    }];

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const publicOrg = {
        nameadmin: org.nameadmin,
        emailadmin: org.emailadmin,
        addressadmin: org.addressadmin,
        phoneadmin: org.phoneadmin,
        tokeorg: org.tokeorg,
        historyOrg: []
      };
      await ctx.stub.putState(org.tokeorg, Buffer.from(JSON.stringify(publicOrg)));
      console.log('Added organization:', publicOrg);
    }
  }
  
  async getFullHospitalBranches(ctx, tokeorg) {
    // Lấy trạng thái của tổ chức từ state database bằng mã token
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    
    // Kiểm tra nếu không tìm thấy tổ chức với mã token
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Chuyển đổi dữ liệu tổ chức từ bytes sang đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Kiểm tra và lấy danh sách bệnh viện
    const hospitalBranches = org.hospitalbranch || [];

    // Trả về danh sách bệnh viện
    return hospitalBranches;
}
  async getBranchDetails(ctx, tokeorg,tokenbrach){
    const orgbytes = await ctx.stub.getState(tokeorg);
    if(!orgbytes || orgbytes.length===0){
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
    const org = JSON.parse(orgbytes.toString());
    const branch = org.hospitalbranch.find(item=>item.tokenbrach === tokenbrach)
    if (!branch) {
      throw new Error(`Branch with token ${tokenbranches} does not exist in organization ${tokeorg}`);
  }
  return branch;

  }

  // async updateOrganizationStatus(ctx, tokeorg, newStatus, datatime) {
  //   const orgAsBytes = await ctx.stub.getState(tokeorg);
  //   if (!orgAsBytes || orgAsBytes.length === 0) {

  //     throw new Error(`Tổ chức với mã token ${tokeorg} không tồn tại`);
  //   }
  //   const org = JSON.parse(orgAsBytes.toString());

  //   // Kiểm tra và log trạng thái hiện tại của tổ chức
  //   const currentStatus = org.statusOrg || "false"; // Mặc định là "UNKNOWN" nếu không có trạng thái
  //   console.log(`Cập nhật trạng thái tổ chức ${tokeorg} từ ${currentStatus} sang ${newStatus}`);

  //   // Cập nhật trạng thái mới cho tổ chức
  //   org.statusOrg = newStatus;
  //   // Thêm mục lịch sử cập nhật trạng thái
  //   org.historyOrg.push({
  //     action: 'UPDATE_STATUS',
  //     timestamp: datatime, // Thời gian hiện tại
  //     data: { previousStatus: currentStatus, newStatus }
  //   });

  //   // Lưu lại trạng thái mới của tổ chức vào ledger
  //   await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

  //   // Trả về thông tin xác nhận
  //   return { orgToken: tokeorg, status: newStatus, message: `Trạng thái tổ chức cập nhật thành công` };

  // }
  // Thêm tổ chức mới
  async createOrganization(ctx, currentTime, nameorg, nameadmin, emailadmin, addressadmin, cccdadmin, phoneadmin, passwordadmin, businessBase64) {
    const txId = ctx.stub.getTxID();
    const tokenorg = this.hasDataToken(nameorg, txId);

    const orgExists = await this.organizationExists(ctx, tokenorg);
    if (orgExists) {
      throw new Error(`Organization with token ${tokenorg} already exists`);
    }

    const organization = {
      nameorg,
      nameadmin,
      emailadmin,
      addressadmin,
      phoneadmin,
      
      businessBase64,
      timestamp: currentTime,
      hospitalbranch: [],

      tokeorg: tokenorg,
      statusOrg: 'false',
      users: [],
      historyOrg: [] // Initial history for the organization
    };

    // const timestamporg = new Date().toISOString(); // Thay bằng một giá trị thời gian duy nhất truyền vào từ client
    organization.historyOrg.push({
      action: 'CREATE_ORG',
      timestamporg: currentTime,
      data: { nameorg, nameadmin, emailadmin, addressadmin, phoneadmin, businessBase64 }
    });

    await ctx.stub.putState(tokenorg, Buffer.from(JSON.stringify(organization)));

    // Create the admin user for the organization
    // await this.createAdmin(ctx, tokenorg, nameadmin, addressadmin, phoneadmin, cccdadmin, passwordadmin);

    console.log(`Organization ${nameorg} created with admin ${nameadmin}`);
    return tokenorg;
  }

  async createAdmin(ctx, tokeorg, fullname, address, phone, cccd, password, organizationalvalue) {
    const txId = ctx.stub.getTxID();
    const tokenuser = this.hasDataToken(fullname, txId);

    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const newUser = {
      fullname,
      address,
      phone,
      typeusers: 'superadmin',  // Assign the correct user type
      cccd,
      password,
      organizationalvalue,
      tokenuser,
      historyUser: []
    };

    newUser.historyUser.push({
      action: 'CREATE_USER',
      // timestamuser: timestamuser,
      data: { fullname, address, phone, typeusers: 'admin', cccd }
    });

    org.users.push(newUser);

    org.historyOrg.push({
      action: 'ADD_USER',
      // timestamp: timestamuser,
      data: { fullname, tokenuser }
    });

    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    console.log(`Admin ${fullname} created in organization ${tokeorg}`);
    return tokenuser;
  }
  async getfunOrganizations(ctx) {
    const iterator = await ctx.stub.getStateByRange('', ''); // Lấy tất cả các mục từ ledger
    const activeOrgs = [];

    // Duyệt qua các mục
    while (true) {
      const res = await iterator.next();
      if (res.done) {
        break;
      }

      const value = res.value.value.toString('utf8');
      const org = JSON.parse(value);

      // Chỉ lấy những tổ chức có statusOrg == true
      if (org.statusOrg === 'true') {
        const publicOrg = {
          tokeorg: org.tokeorg,
          nameorg: org.nameorg
        };
        activeOrgs.push(publicOrg);
      }
    }

    // Đóng iterator
    await iterator.close();

    return activeOrgs;
  }
  async createrdetailbranch(ctx, tokeorg, branchname, branchaddress, branchphone, branchemail, branchbusinesslicense, timecreate) {
    // Lấy dữ liệu tổ chức theo token
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }
  
    // Tạo token chi nhánh
    const tokenbrach = this.hasDataToken(branchname, tokeorg);
  
    // Parse dữ liệu tổ chức
    const org = JSON.parse(orgAsBytes.toString());
  
    // Tạo chi nhánh mới
    const newbranch = {
      tokenbrach,
      branchname,
      branchaddress,
      branchphone,
      branchemail,
      branchbusinesslicense,
      timecreate,
      recordstatus:[],
    };
  
    // Thêm lịch sử tạo chi nhánh
    org.historyOrg.push({
      action: 'CREATE_BRANCH',
      timestamp: timecreate,
      data: newbranch
    });
  
    // Thêm chi nhánh vào tổ chức
    org.hospitalbranch.push(newbranch);
  
    // Cập nhật lại trạng thái của tổ chức
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  
    console.log(`Chi nhánh ${branchname} được tạo với token ${tokenbrach} trong tổ chức ${tokeorg}`);
  
    return tokenbrach;
  }
  async addRecordStatusBranch(ctx, tokeorg, brach, cccd, content, timerequest) {
    // Lấy thông tin tổ chức (org) dựa trên token tổ chức (tokeorg)
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }

    // Chuyển đổi dữ liệu tổ chức từ bytes thành đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Tìm kiếm branch dựa trên tokenbranch
    const branch = org.branches.find(b => b.token === brach);
    if (!branch) {
        throw new Error(`Chi nhánh với token ${brach} không tồn tại trong tổ chức ${tokeorg}`);
    }

    // Thêm bản ghi vào mảng recordstatus[] của chi nhánh
    const newRecord = {
        cccd: cccd,
        content: content,
        timerequest: timerequest,
        status: "pending" // Hoặc bất kỳ trạng thái mặc định nào
    };
    

    // Thêm bản ghi mới vào mảng
    branch.recordstatus.push(newRecord);

    // Cập nhật lại thông tin tổ chức với bản ghi mới
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

    return `Bản ghi đã được thêm vào chi nhánh với token ${tokenbrach} trong tổ chức ${tokeorg}`;
}

  // Đăng nhập người dùng vào tổ chức
  async loginOrganization(ctx, tokeorg, cccd) {
    // Lấy thông tin của tổ chức dựa trên token (tokeorg)
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }

    // Phân tích chi tiết tổ chức
    const org = JSON.parse(orgAsBytes.toString());

    // Tìm kiếm người dùng dựa trên cccd
    const user = org.users.find(user => user.cccd === cccd);

    if (!user) {
      throw new Error('Người dùng không tồn tại trong tổ chức này');
    }

    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu trong chaincode
    return {
      message: `Thông tin người dùng: ${user.fullname}`,
      tokenuser: user.tokenuser,  // Token này có thể dùng cho phiên hoặc xác thực JWT
      typeusers: user.typeusers,
      branch: user.branch,
      nameorg: org.nameorg,
      tokeorg: org.tokeorg,
      passwordvalue: user.password,
    };
  }

  async createpersonnel(ctx, tokeorg, branch, fullname, address, phone, typeusers, cccd, password, imgidentification, timecreats) {
    try {
      const txId = ctx.stub.getTxID();
      const tokenuser = this.hasDataToken(fullname, txId);  // Giả sử là đồng bộ. Nếu không, cần sử dụng await.
  
      // Lấy thông tin tổ chức từ ledger
      const orgAsBytes = await ctx.stub.getState(tokeorg);
      if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
      }
  
      const org = JSON.parse(orgAsBytes.toString());
  
      // Kiểm tra và khởi tạo mảng nếu cần
      org.users = org.users || [];
      org.historyOrg = org.historyOrg || [];
  
      // Tạo người dùng mới
      const newUser = {
        fullname,
        address,
        phone,
        typeusers,
        cccd,
        password,
        imgidentification,
        branch,
        timecreats,
        tokenuser,
        historyUser: []  // Khởi tạo lịch sử người dùng mới
      };
  
      // Thêm lịch sử cho người dùng mới
      newUser.historyUser.push({
        action: 'CREATE_USER',
        timestamp: timecreats,
        data: { fullname, address, phone, typeusers, cccd }
      });
  
      // Thêm người dùng mới vào danh sách người dùng của tổ chức
      org.users.push(newUser);
  
      // Thêm lịch sử cho tổ chức
      org.historyOrg.push({
        action: 'ADD_USER',
        timestamp: timecreats,
        data: { fullname, tokenuser }
      });
  
      // Lưu lại trạng thái của tổ chức
      await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  
      console.log(`User ${fullname} created in organization ${tokeorg}`);
      return tokenuser;
  
    } catch (error) {
      console.error(`Failed to create user: ${error.message}`);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
  
  async getfullpersonnel(ctx,tokeorg){
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Chuyển đổi dữ liệu từ bytes sang JSON
    const organization = JSON.parse(orgAsBytes.toString());

    // Trả về danh sách users của tổ chức
    return organization.users;
  }
  // async loginOrganization(ctx,cccd,passwordadmin){
  //   try{
  //     const orgAsBytes = await ctx.stub.getState(tokeorg);
  //     if (!orgAsBytes || orgAsBytes.length === 0) {
  //       return { success: false, message: `Organization with token ${tokeorg} does not exist` };
  //     }
  //   }catch(error){
  //     return { success: false, message: `Error occurred: ${error.message}` };

  //   }
  // }
  async updateOrganizationStatus(ctx, tokeorg, newStatus, currentTime) {
    // Retrieve the organization state by token
    const orgAsBytes = await ctx.stub.getState(tokeorg);

    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Parse the retrieved organization
    const org = JSON.parse(orgAsBytes.toString());

    // Log the current and new status (assuming there’s a `status` property in the organization)
    const currentStatus = org.statusOrg || "false"; // Default to "UNKNOWN" if status does not exist
    console.log(`Updating status of organization ${tokeorg} from ${currentStatus} to ${newStatus}`);

    // Update the organization's status
    org.statusOrg = newStatus;

    // Add history entry for the status update
    org.historyOrg.push({
      action: 'UPDATE_STATUS',
      timestamp: currentTime,
      data: { previousStatus: currentStatus, newStatus }
    });

    // Save the updated organization state back to the ledger
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

    // Return confirmation or updated organization data
    return { orgToken: tokeorg, status: newStatus, message: `Organization status updated successfully` };
  }

  // Cập nhật thông tin người dùng
  async updateUser(ctx, tokenorg, cccd, fullname, address, phone, typeusers, password) {
    const orgAsBytes = await ctx.stub.getState(tokenorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokenorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found`);
    }

    user.fullname = fullname;
    user.address = address;
    user.phone = phone;
    user.typeusers = typeusers;
    user.password = password;

    user.historyUser.push({
      action: 'UPDATE_USER',
      timestamp: new Date().toISOString(),
      updatedFields: { fullname, address, phone, typeusers, password }
    });

    await ctx.stub.putState(tokenorg, Buffer.from(JSON.stringify(org)));
    console.log(`User ${cccd} updated in organization ${tokenorg}`);
  }

  // Kiểm tra quyền admin
  async checkroleAdmin(ctx) {
    const clientMSPID = ctx.clientIdentity.getMSPID();

    if (clientMSPID === 'Org1MSP') {
      return true;
    } else {
      return false;
    }
  }

  // Thêm người dùng vào tổ chức
  
  async getUserByTokeorg(ctx, tokeorg, tokenuser) {
    // Lấy dữ liệu tổ chức từ ledger
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    // Chuyển đổi dữ liệu từ bytes thành đối tượng
    const org = JSON.parse(orgAsBytes.toString());
  
    // Kiểm tra xem org là một mảng hay không
  
    // Tìm người dùng trong tổ chức dựa trên token

    const user = org.users.find(item => item.tokenuser === tokenuser);
    if (!user) {
      throw new Error('User does not exist in this organization');
    }
  
    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu
    return user;
  }
  
  

  // Lấy thông tin tổ chức
  async getOrganization(ctx, tokeorg) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());
    const result = {
      nameorg: org.nameorg,
      nameadmin: org.nameadmin,
      emailadmin: org.emailadmin,
      addressadmin: org.addressadmin,
      phoneadmin: org.phoneadmin,
      businessBase64: org.businessBase64,
      tokeorg: org.tokeorg,
      statusOrg: org.statusOrg,
  };

  // Trả về thông tin tổ chức
  return result;
  }

  // Kiểm tra tổ chức đã tồn tại chưa
  async organizationExists(ctx, tokeorg) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    return orgAsBytes && orgAsBytes.length > 0;
  }

  // Lấy thông tin người dùng từ tổ chức
  async getinfoUser(ctx, tokeorg, cccd) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found in organization ${tokeorg}`);
    }

    return user;
  }

// Lấy toàn bộ thông tin các tổ chức
async getAllOrganizations(ctx) {
  try {
    // Khởi tạo mảng để lưu các tổ chức
    const organizations = [];

    // Lấy tất cả các khóa của các tổ chức từ trạng thái chuỗi
    const iterator = await ctx.stub.getStateByRange('', '');

    // Duyệt qua các mục trong iterator
    let res = await iterator.next();
    while (!res.done) {
      // Kiểm tra nếu mục có giá trị và không phải là giá trị không hợp lệ
      if (res.value && res.value.value.toString()) {
        try {
          const value = JSON.parse(res.value.value.toString('utf8'));
          
          // Kiểm tra xem mục có phải là tổ chức không (có thể kiểm tra theo thuộc tính hoặc cấu trúc)
          if (value.tokeorg) {
            organizations.push(value);
          }
        } catch (error) {
          console.error(`Error parsing JSON for key ${res.value.key}: ${error.message}`);
        }
      }
      res = await iterator.next();
    }

    // Đóng iterator để giải phóng tài nguyên
    await iterator.close();

    // Trả về danh sách các tổ chức
    return organizations;
  } catch (error) {
    console.error(`Error in getAllOrganizations: ${error.message}`);
    throw new Error(`Failed to get all organizations: ${error.message}`);
  }
}




  //   async getActiveOrganizations(ctx) {
  //     const queryString = {
  //         selector: {
  //             statusOrg: 'true'
  //         }
  //     };

  //     const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
  //     const organizations = [];

  //     while (true) {
  //         const res = await resultsIterator.next();

  //         if (res.value && res.value.value.toString()) {
  //             const org = JSON.parse(res.value.value.toString('utf8'));
  //             organizations.push(org);
  //         }

  //         if (res.done) {
  //             await resultsIterator.close();
  //             break;
  //         }
  //     }

  //     return organizations;
  // }

  // Hàm băm dữ liệu để tạo token, sử dụng txID để đảm bảo tính định tính
  hasDataToken(data, txId) {
    const dataWithTxId = `${data}:${txId}`;
    const hash = crypto.createHash('sha256');
    hash.update(dataWithTxId);
    return hash.digest('hex');
  }
}

module.exports = OrgChaincode;
